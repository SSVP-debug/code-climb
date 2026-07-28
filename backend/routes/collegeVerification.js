import { Router } from "express";
import crypto from "crypto";
import User from "../models/User.js";
import College from "../models/College.js";
import { requireAuth } from "../middleware/auth.js";
import { collegeVerificationResendLimiter } from "../middleware/rateLimiter.js";
import { isDomainAutoVerified, isConsumerEmailDomain } from "../utils/domainVerification.js";
import { getResendClient, getFromAddress } from "../config/resend.js";
import { SITE_URL } from "../config/site.js";

const router = Router();

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Student college verification (Phase 12C, revised).
 *
 * Two independent facts, tracked separately on User.education:
 *   - emailVerified   — "does this user control this institutional inbox."
 *                        Proven by clicking the confirmation link. Never
 *                        blocked on whether we've heard of the college.
 *   - collegeStatus   — "has Code Club reviewed and approved this
 *                        institution." "unset" until the email is verified,
 *                        then "verified" (recognized domain, or later
 *                        admin approval) or "pending"/"rejected".
 *
 * A recognized domain (already on the VerifiedDomain "college" allowlist,
 * shared with TPO signup) skips admin review entirely — same "hybrid
 * verification" precedent tpo.js already uses. An unrecognized domain
 * creates (or reuses) a pending College record and the student is still
 * allowed to verify their email immediately; the institution goes into the
 * same admin queue TPO college requests already use
 * (GET /api/admin/pending → studentCollegeRequests).
 *
 * Still a confirmation link (not OTP) via Resend — unchanged mechanism from
 * the original v1 scope note, deliberately not duplicated with a second
 * verification method.
 */

// Extract the current Resend-sending logic into a shared helper so both
// /request and /resend can send the identical email without duplicating
// the template.
async function sendVerificationEmail(userDoc, collegeEmail, token) {
  const resend = await getResendClient();
  if (!resend) return { emailSent: false };

  const verifyUrl = `${SITE_URL}/verify-college?token=${token}`;
  const result = await resend.emails.send({
    from: getFromAddress(),
    to: collegeEmail,
    subject: "Verify your college email — Code Club",
    html: `
      <p>Hi ${userDoc.displayName || "there"},</p>
      <p>Click the link below to verify <strong>${collegeEmail}</strong> and unlock your College Leaderboard on Code Club.</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>This link expires in 24 hours. If you didn't request this, you can ignore this email.</p>
    `,
    text: `Verify ${collegeEmail} for Code Club: ${verifyUrl} (expires in 24 hours)`,
  });

  if (result.error) {
    console.error("[CollegeVerification] Resend error:", result.error.message);
    // Don't fail the caller over an email-delivery hiccup — the token is
    // already saved, so the student can request a fresh link via /resend if
    // this one never arrives. Surface it as a soft warning instead.
    return { emailSent: false };
  }
  return { emailSent: true };
}

// Atomic find-or-create for a pending College record. Uses a single
// findOneAndUpdate upsert rather than a find-then-create pair — two
// students submitting the same brand-new domain at nearly the same time
// must resolve to the same College document, not two. $setOnInsert only
// applies on the insert branch, so a losing concurrent call just gets back
// the winner's already-created doc instead of throwing a duplicate-key
// error.
async function findOrCreatePendingCollege({ domain, name, website, submittedBy, submittedByRole }) {
  const existing = await College.findByDomain(domain);
  if (existing?.status === "rejected") {
    // Previously reviewed and not approved — don't silently re-queue it.
    // This is the one legitimate remaining use of a "contact support"
    // style message: a genuine exceptional fallback, not the default
    // unknown-college path.
    const err = new Error(
      "This institution was previously reviewed and not approved. Contact support if you believe this is an error."
    );
    err.statusCode = 409;
    throw err;
  }
  if (existing) return existing;

  return College.findOneAndUpdate(
    { domains: domain },
    {
      $setOnInsert: {
        domains: [domain],
        name,
        website,
        status: "pending",
        submittedBy,
        submittedByRole,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

// ── POST /api/college-verification/request ─────────────────────────────────
router.post("/request", requireAuth, async (req, res) => {
  try {
    const { collegeEmail, collegeName, collegeWebsite, degree, branch, graduationYear } = req.body;

    if (!collegeEmail || !EMAIL_RE.test(collegeEmail)) {
      return res.status(400).json({ error: "A valid college email address is required." });
    }

    const domain = collegeEmail.split("@")[1].toLowerCase();

    if (isConsumerEmailDomain(domain)) {
      return res.status(400).json({
        error: "Please use your institutional email address, not a personal email provider.",
      });
    }

    const recognized = await isDomainAutoVerified(domain, "college");
    let college = null;

    if (!recognized) {
      if (!collegeName?.trim()) {
        // Signals the frontend to show the "We haven't added your college
        // yet" step and collect a name (+ optional website) rather than a
        // generic toast — this is NOT a dead end, it's a state transition.
        return res.status(400).json({
          error: "College name is required for an unrecognized domain.",
          code: "COLLEGE_NAME_REQUIRED",
        });
      }

      try {
        college = await findOrCreatePendingCollege({
          domain,
          name: collegeName.trim(),
          website: collegeWebsite?.trim() || null,
          submittedBy: req.userDoc._id,
          submittedByRole: "student",
        });
      } catch (err) {
        if (err.statusCode) {
          return res.status(err.statusCode).json({ error: err.message });
        }
        throw err;
      }
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
    const existingEducation = req.userDoc.education?.toObject?.() ?? req.userDoc.education ?? {};

    req.userDoc.education = {
      ...existingEducation,
      collegeName: collegeName?.trim() || existingEducation.collegeName || null,
      degree: degree?.trim() || existingEducation.degree || null,
      branch: branch?.trim() || existingEducation.branch || null,
      graduationYear: graduationYear ? Number(graduationYear) : existingEducation.graduationYear || null,
      collegeEmail: collegeEmail.toLowerCase(),
      collegeId: college?._id || null,
      // Flip on confirm, not here — an unconfirmed request must never show
      // as pending/verified in the UI.
      emailVerified: false,
      emailVerifiedAt: null,
      collegeStatus: "unset",
      verifyToken: token,
      verifyTokenExpiresAt: expiresAt,
    };
    await req.userDoc.save();

    const sendResult = await sendVerificationEmail(req.userDoc, collegeEmail, token);

    return res.json({
      success: true,
      emailSent: sendResult.emailSent,
      collegeRecognized: recognized,
      collegeName: recognized ? null : college.name,
      collegeStatus: recognized ? null : college.status, // lets the frontend
        // handle the rare "someone else's request for this same unknown
        // domain was already approved/rejected between page-load and submit"
        // case without a separate round-trip
    });
  } catch (err) {
    console.error("[CollegeVerification] request:", err.message);
    return res.status(500).json({ error: "Failed to start verification." });
  }
});

// ── POST /api/college-verification/resend ───────────────────────────────────
router.post("/resend", requireAuth, collegeVerificationResendLimiter, async (req, res) => {
  try {
    const edu = req.userDoc.education;
    if (!edu?.collegeEmail) {
      return res.status(400).json({ error: "No pending verification to resend." });
    }
    if (edu.emailVerified) {
      return res.status(400).json({ error: "This email is already verified." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    req.userDoc.education.verifyToken = token;
    req.userDoc.education.verifyTokenExpiresAt = new Date(Date.now() + TOKEN_TTL_MS);
    await req.userDoc.save();

    const sendResult = await sendVerificationEmail(req.userDoc, edu.collegeEmail, token);
    return res.json({ success: true, emailSent: sendResult.emailSent });
  } catch (err) {
    console.error("[CollegeVerification] resend:", err.message);
    return res.status(500).json({ error: "Failed to resend verification." });
  }
});

// ── GET /api/college-verification/confirm?token=... ────────────────────────
// Requires auth in addition to the token itself — a leaked/forwarded email
// link alone isn't enough to verify someone else's account.
router.get("/confirm", requireAuth, async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "token required." });

    const user = await User.findById(req.userDoc._id)
      .select("+education.verifyToken +education.verifyTokenExpiresAt");

    if (!user?.education?.verifyToken || user.education.verifyToken !== token) {
      return res.status(400).json({ error: "Invalid or expired verification link." });
    }
    if (user.education.verifyTokenExpiresAt < new Date()) {
      return res.status(400).json({ error: "This verification link has expired. Request a new one." });
    }

    user.education.emailVerified = true;
    user.education.emailVerifiedAt = new Date();
    user.education.verifyToken = null;
    user.education.verifyTokenExpiresAt = null;

    if (user.education.collegeId) {
      // Re-read live status — it may have been approved/rejected by an
      // admin between the /request call and this confirmation.
      const college = await College.findById(user.education.collegeId).lean();
      user.education.collegeStatus = college?.status ?? "pending";
    } else {
      // Recognized-domain path never created a College link — the
      // institution was already trusted at request time.
      user.education.collegeStatus = "verified";
    }

    await user.save();

    return res.json({
      success: true,
      collegeName: user.education.collegeName,
      collegeStatus: user.education.collegeStatus,
    });
  } catch (err) {
    console.error("[CollegeVerification] confirm:", err.message);
    return res.status(500).json({ error: "Failed to confirm verification." });
  }
});

// ── GET /api/college-verification/status ────────────────────────────────────
// Powers the Education section on Profile — current state, no sensitive
// token fields (default select excludes them already).
router.get("/status", requireAuth, async (req, res) => {
  return res.json({ education: req.userDoc.education || null });
});

export default router;