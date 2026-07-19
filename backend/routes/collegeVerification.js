import { Router } from "express";
import crypto from "crypto";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { isDomainAutoVerified } from "../utils/domainVerification.js";
import { getResendClient, getFromAddress } from "../config/resend.js";
import { SITE_URL } from "../config/site.js";

const router = Router();

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Student college verification (Phase 12C).
 *
 * v1 scope, confirmed with Bunny: domain-based only, no OTP. A student's
 * college email domain is checked against the same VerifiedDomain
 * allowlist that already powers TPO auto-verification (type: "college") —
 * no separate list to maintain. A confirmation link (not a code) is still
 * emailed to prove the student actually has access to that inbox, since
 * unlike TPO signup this isn't gated by account creation itself.
 *
 * Deliberately NOT built here (flagged, not silently skipped):
 *   - A manual-review queue for unrecognized domains (TPO signup has one;
 *     students don't in v1 — matches "keep it simple" from the PRD).
 *   - College-only contests / college achievements — the PRD's other two
 *     unlocks. Verification + the leaderboard gate are the core of what
 *     "College Leaderboard access" means; the other two are real, separate
 *     scope (contest visibility filtering, a new achievement type) better
 *     shipped as their own follow-up than rushed alongside this.
 */

// ── POST /api/college-verification/request ─────────────────────────────────
router.post("/request", requireAuth, async (req, res) => {
  try {
    const { collegeEmail, collegeName, degree, branch, graduationYear } = req.body;

    if (!collegeEmail || !EMAIL_RE.test(collegeEmail)) {
      return res.status(400).json({ error: "A valid college email address is required." });
    }
    if (!collegeName?.trim()) {
      return res.status(400).json({ error: "College name is required." });
    }

    const domain = collegeEmail.split("@")[1].toLowerCase();
    const recognized = await isDomainAutoVerified(domain, "college");
    if (!recognized) {
      return res.status(400).json({
        error: "This college isn't in our verified list yet. Contact support if you believe this is an error.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    req.userDoc.education = {
      collegeName: collegeName.trim(),
      degree: degree?.trim() || null,
      branch: branch?.trim() || null,
      graduationYear: graduationYear ? Number(graduationYear) : null,
      collegeEmail: collegeEmail.toLowerCase(),
      verified: false,
      verifiedAt: null,
      verifyToken: token,
      verifyTokenExpiresAt: expiresAt,
    };
    await req.userDoc.save();

    const resend = await getResendClient();
    if (resend) {
      const verifyUrl = `${SITE_URL}/verify-college?token=${token}`;
      const result = await resend.emails.send({
        from: getFromAddress(),
        to: collegeEmail,
        subject: "Verify your college email — Code Club",
        html: `
          <p>Hi ${req.userDoc.displayName || "there"},</p>
          <p>Click the link below to verify <strong>${collegeEmail}</strong> and unlock your College Leaderboard on Code Club.</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          <p>This link expires in 24 hours. If you didn't request this, you can ignore this email.</p>
        `,
        text: `Verify ${collegeEmail} for Code Club: ${verifyUrl} (expires in 24 hours)`,
      });
      if (result.error) {
        console.error("[CollegeVerification] Resend error:", result.error.message);
        // Don't fail the request over an email-delivery hiccup — the token
        // is already saved, so the student can request a fresh link if
        // this one never arrives. Surface it as a soft warning instead.
        return res.json({ success: true, emailSent: false });
      }
    }

    return res.json({ success: true, emailSent: Boolean(resend) });
  } catch (err) {
    console.error("[CollegeVerification] request:", err.message);
    return res.status(500).json({ error: "Failed to start verification." });
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

    user.education.verified = true;
    user.education.verifiedAt = new Date();
    user.education.verifyToken = null;
    user.education.verifyTokenExpiresAt = null;
    await user.save();

    return res.json({ success: true, collegeName: user.education.collegeName });
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