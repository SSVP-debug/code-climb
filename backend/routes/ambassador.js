import { Router } from "express";
import Ambassador from "../models/Ambassador.js";
import User from "../models/User.js";
import { requireRole } from "../middleware/roleGuard.js";
import { getOrCreateReferralCode } from "./referral.js";
import { AMBASSADOR_MILESTONES } from "../config/ambassadorMilestones.js";
import { SITE_URL } from "../config/site.js";

const router = Router();

// ── POST /api/ambassador/apply ──────────────────────────────────────────────
router.post("/apply", async (req, res) => {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const { collegeName, collegeDomain, motivation } = req.body;

    if (!collegeName?.trim() || !collegeDomain?.trim()) {
      return res.status(400).json({ error: "collegeName and collegeDomain are required." });
    }

    const existing = await Ambassador.findOne({ userId: req.userDoc._id });
    if (existing) {
      return res.status(409).json({
        error: `You already have an application (status: ${existing.status}).`,
        status: existing.status,
      });
    }

    const application = await Ambassador.create({
      userId: req.userDoc._id,
      collegeName: collegeName.trim(),
      collegeDomain: collegeDomain.trim().toLowerCase(),
      motivation: motivation?.trim() || "",
    });

    req.log.info(
      { userId: req.userDoc._id.toString(), collegeDomain: application.collegeDomain },
      "[Ambassador] New application submitted"
    );

    return res.status(201).json({
      status: application.status,
      appliedAt: application.appliedAt,
    });
  } catch (err) {
    req.log.error({ err }, "[Ambassador] apply failed");
    return res.status(500).json({ error: "Failed to submit application." });
  }
});

// ── GET /api/ambassador/status ──────────────────────────────────────────────
router.get("/status", async (req, res) => {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const application = await Ambassador.findOne({ userId: req.userDoc._id }).lean();

    if (!application) {
      return res.json({ hasApplied: false, status: null });
    }

    return res.json({
      hasApplied: true,
      status: application.status,
      appliedAt: application.appliedAt,
      rejectionReason: application.rejectionReason,
    });
  } catch (err) {
    req.log.error({ err }, "[Ambassador] status check failed");
    return res.status(500).json({ error: "Failed to load application status." });
  }
});

// ── GET /api/ambassador/dashboard ───────────────────────────────────────────
router.get("/dashboard", async (req, res) => {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const application = await Ambassador.findOne({ userId: req.userDoc._id });

    if (!application || application.status !== "approved") {
      return res.status(403).json({
        error: "You must be an approved ambassador to view this dashboard.",
      });
    }

    // Reuse the existing referral system entirely — this IS the
    // ambassador's referral tracking, not a separate count.
    const code = await getOrCreateReferralCode(req.userDoc);
    const referredCount = await User.countDocuments({ referredBy: code });

    const milestones = AMBASSADOR_MILESTONES.map((m) => ({
      ...m,
      achieved: referredCount >= m.threshold,
      claimed: application.milestonesClaimed.includes(m.id),
    }));

    return res.json({
      collegeName: application.collegeName,
      referralCode: code,
      shareUrl: `${SITE_URL}/login?ref=${code}`,
      referredCount,
      rewardDaysEarned: req.userDoc.referralRewardDays || 0,
      milestones,
    });
  } catch (err) {
    req.log.error({ err }, "[Ambassador] dashboard failed");
    return res.status(500).json({ error: "Failed to load ambassador dashboard." });
  }
});

// ── POST /api/ambassador/claim-milestone ────────────────────────────────────
router.post("/claim-milestone", async (req, res) => {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const { milestoneId } = req.body;
    const milestone = AMBASSADOR_MILESTONES.find((m) => m.id === milestoneId);
    if (!milestone) {
      return res.status(400).json({ error: "Unknown milestone." });
    }

    const application = await Ambassador.findOne({ userId: req.userDoc._id });
    if (!application || application.status !== "approved") {
      return res.status(403).json({ error: "You must be an approved ambassador." });
    }

    const code = await getOrCreateReferralCode(req.userDoc);
    const referredCount = await User.countDocuments({ referredBy: code });

    if (referredCount < milestone.threshold) {
      return res.status(400).json({
        error: `Not yet reached — ${referredCount}/${milestone.threshold} referrals.`,
      });
    }

    // Atomic claim: the filter only matches (and only pushes) if this
    // milestone hasn't already been claimed, so two concurrent requests for
    // the same milestone can't both pass and both award the reward days.
    // Previously this was a read-check-save on two separate documents
    // (Ambassador + User), which could race.
    const claimedApplication = await Ambassador.findOneAndUpdate(
      { _id: application._id, milestonesClaimed: { $ne: milestoneId } },
      { $push: { milestonesClaimed: milestoneId } },
      { new: true }
    );

    if (!claimedApplication) {
      return res.status(409).json({ error: "Milestone already claimed." });
    }

    // Extend the SAME field the base referral system already uses —
    // stacking on top, not a parallel reward ledger. Safe to apply
    // unconditionally now that the claim above is guaranteed exclusive.
    const updatedUser = await User.findByIdAndUpdate(
      req.userDoc._id,
      { $inc: { referralRewardDays: milestone.rewardDays } },
      { new: true }
    ).select("referralRewardDays");

    req.log.info(
      { userId: req.userDoc._id.toString(), milestoneId, rewardDays: milestone.rewardDays },
      "[Ambassador] Milestone claimed"
    );

    return res.json({
      claimed: milestoneId,
      rewardDays: milestone.rewardDays,
      totalRewardDays: updatedUser.referralRewardDays,
    });
  } catch (err) {
    req.log.error({ err }, "[Ambassador] claim-milestone failed");
    return res.status(500).json({ error: "Failed to claim milestone." });
  }
});

// ── GET /api/ambassador/pending (admin) ─────────────────────────────────────
router.get("/pending", requireRole("admin"), async (req, res) => {
  try {
    const pending = await Ambassador.find({ status: "pending" })
      .populate("userId", "displayName email username")
      .sort({ appliedAt: 1 })
      .lean();

    return res.json({ applications: pending });
  } catch (err) {
    req.log.error({ err }, "[Ambassador] pending list failed");
    return res.status(500).json({ error: "Failed to load pending applications." });
  }
});

// ── POST /api/ambassador/:id/review (admin) ─────────────────────────────────
router.post("/:id/review", requireRole("admin"), async (req, res) => {
  try {
    const { approve, rejectionReason } = req.body;
    const application = await Ambassador.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ error: "Application not found." });
    }
    if (application.status !== "pending") {
      return res.status(409).json({ error: `Already reviewed (status: ${application.status}).` });
    }

    application.status = approve ? "approved" : "rejected";
    application.reviewedAt = new Date();
    application.reviewedBy = req.userDoc._id;
    if (!approve) application.rejectionReason = rejectionReason || "Not specified";

    await application.save();

    req.log.info(
      { applicationId: application._id.toString(), decision: application.status, reviewedBy: req.userDoc._id.toString() },
      "[Ambassador] Application reviewed"
    );

    return res.json({ status: application.status });
  } catch (err) {
    req.log.error({ err }, "[Ambassador] review failed");
    return res.status(500).json({ error: "Failed to review application." });
  }
});

export default router;