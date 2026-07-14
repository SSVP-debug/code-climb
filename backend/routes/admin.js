/**
 * Admin routes — Phase B: verification approval queue.
 *
 * GET  /api/admin/pending              — list everything awaiting manual review
 * POST /api/admin/recruiters/:id/approve
 * POST /api/admin/recruiters/:id/reject
 * POST /api/admin/tpo/:collegeId/approve
 * POST /api/admin/tpo/:collegeId/reject
 *
 * All routes require role="admin". Note: this router is mounted in
 * server.js WITH requireAuth + apiLimiter (fixed alongside this file —
 * it was previously mounted without requireAuth, which meant req.userDoc
 * was never populated and requireRole("admin") silently 403'd on every
 * call. The one pre-existing endpoint here was unreachable in practice.)
 */
import { Router } from "express";
import College from "../models/College.js";
import User from "../models/User.js";
import { requireRole } from "../middleware/roleGuard.js";
import { createNotification } from "../services/notificationService.js";

const router = Router();

// Only the fields an admin needs to make an approve/reject decision —
// never the full user document.
const RECRUITER_QUEUE_FIELDS =
  "email displayName recruiterProfile createdAt";

// ── GET /api/admin/pending ──────────────────────────────────────────────────
router.get("/pending", requireRole("admin"), async (req, res) => {
  try {
    const [recruiters, tpoColleges] = await Promise.all([
      User.find(
        { role: "recruiter", "recruiterProfile.verified": false },
        RECRUITER_QUEUE_FIELDS
      )
        .sort({ createdAt: 1 })
        .lean(),
      College.find({ verified: false })
        .populate("adminUserId", "email displayName")
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    return res.json({
      recruiters: recruiters.map((u) => ({
        id: u._id,
        email: u.email,
        displayName: u.displayName,
        companyName: u.recruiterProfile?.companyName,
        designation: u.recruiterProfile?.designation,
        companyDomain: u.recruiterProfile?.companyDomain,
        requestedAt: u.createdAt,
      })),
      tpos: tpoColleges.map((c) => ({
        collegeId: c._id,
        collegeName: c.name,
        domain: c.domain,
        requestedBy: c.adminUserId
          ? { email: c.adminUserId.email, displayName: c.adminUserId.displayName }
          : null,
        requestedAt: c.createdAt,
      })),
    });
  } catch (err) {
    console.error("[Admin] pending queue error:", err.message);
    return res.status(500).json({ error: "Failed to load pending queue." });
  }
});

// ── POST /api/admin/recruiters/:id/approve ──────────────────────────────────
router.post("/recruiters/:id/approve", requireRole("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.role !== "recruiter") {
      return res.status(404).json({ error: "Recruiter not found." });
    }

    user.recruiterProfile.verified = true;
    user.recruiterProfile.verifiedAt = new Date();
    await user.save();

    createNotification({
      userId: user._id,
      type: "recruiter_verified",
      title: "Recruiter access approved",
      message: `You're verified for ${user.recruiterProfile.companyName}. Your dashboard is ready.`,
      link: "/recruiter/dashboard",
    }).catch(() => {}); // fire-and-forget — never block the approval on this

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Failed to approve recruiter." });
  }
});

// ── POST /api/admin/recruiters/:id/reject ───────────────────────────────────
// Reverts the account back to a plain student — they're free to re-apply
// (e.g. after fixing a typo'd company name) rather than being locked out.
router.post("/recruiters/:id/reject", requireRole("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.role !== "recruiter") {
      return res.status(404).json({ error: "Recruiter not found." });
    }

    const companyName = user.recruiterProfile?.companyName;

    user.role = "student";
    user.recruiterProfile = {
      companyName: null,
      designation: null,
      companyDomain: null,
      verified: false,
      verifiedAt: null,
    };
    await user.save();

    createNotification({
      userId: user._id,
      type: "recruiter_rejected",
      title: "Recruiter access request declined",
      message: companyName
        ? `We couldn't verify your request for ${companyName}. Reach out if this was a mistake.`
        : "We couldn't verify your recruiter access request.",
      link: "/recruiter/signup",
    }).catch(() => {});

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Failed to reject recruiter." });
  }
});

// ── POST /api/admin/tpo/:collegeId/approve ──────────────────────────────────
router.post("/tpo/:collegeId/approve", requireRole("admin"), async (req, res) => {
  try {
    const college = await College.findById(req.params.collegeId);

    if (!college) {
      return res.status(404).json({ error: "College request not found." });
    }

    const now = new Date();
    college.verified = true;
    college.verifiedAt = now;
    await college.save();

    // In the ordinary case this is just the one requester (adminUserId) —
    // updateMany here is defensive for the (currently impossible, but
    // cheap to guard) case of more than one unverified tpoProfile pointing
    // at the same domain.
    await User.updateMany(
      { role: "tpo", "tpoProfile.collegeDomain": college.domain, "tpoProfile.verified": false },
      { $set: { "tpoProfile.verified": true, "tpoProfile.verifiedAt": now } }
    );

    if (college.adminUserId) {
      createNotification({
        userId: college.adminUserId,
        type: "tpo_verified",
        title: "TPO access approved",
        message: `${college.name} is verified. Your placement dashboard is ready.`,
        link: "/tpo/dashboard",
      }).catch(() => {});
    }

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Failed to approve TPO." });
  }
});

// ── POST /api/admin/tpo/:collegeId/reject ───────────────────────────────────
// Removes the pending College claim entirely and reverts the requester to
// a plain student — same "free to re-apply" pattern as recruiter reject.
router.post("/tpo/:collegeId/reject", requireRole("admin"), async (req, res) => {
  try {
    const college = await College.findById(req.params.collegeId);

    if (!college) {
      return res.status(404).json({ error: "College request not found." });
    }

    const requesterId = college.adminUserId;
    const collegeName = college.name;

    await College.deleteOne({ _id: college._id });

    if (requesterId) {
      const user = await User.findById(requesterId);
      if (user && user.role === "tpo") {
        user.role = "student";
        user.tpoProfile = {
          collegeDomain: null,
          collegeName: null,
          verified: false,
          requestedAt: null,
          verifiedAt: null,
        };
        await user.save();
      }

      createNotification({
        userId: requesterId,
        type: "tpo_rejected",
        title: "TPO access request declined",
        message: `We couldn't verify your request for ${collegeName}. Reach out if this was a mistake.`,
        link: "/tpo/signup",
      }).catch(() => {});
    }

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: "Failed to reject TPO request." });
  }
});

export default router;