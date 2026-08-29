import Contribution from "../models/Contribution.js";
import {
  approveContribution as approveContributionService,
  rejectContribution as rejectContributionService,
  retryPendingContributionRewards,
} from "../services/contribution.js";
import { recordAdminAction } from "../services/adminAuditLog.js";

/**
 * controllers/adminContributionController.js — admin review queue and
 * reward-retry reconciliation for Contribution Infrastructure (Phase 2F).
 * Mirrors controllers/adminReferralController.js's shape (thin controller,
 * all the actual state-transition/idempotency logic lives in
 * services/contribution.js) since that's the only other "admin reviews a
 * user-generated row that feeds RewardLedger" flow in this codebase.
 */

// ── GET /api/admin/contributions?status=pending ─────────────────────────────
// Defaults to the review queue (status=pending) since that's the
// overwhelming common case for this endpoint; any status value in the
// model's enum can be requested for audit/history purposes.
export async function listContributionsAdmin(req, res) {
  try {
    const status = req.query.status || "pending";
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 20, 100);

    const filter = status === "all" ? {} : { status };

    const [contributions, total] = await Promise.all([
      Contribution.find(filter)
        .sort({ createdAt: 1 }) // oldest-first — a review queue, not a feed
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("contributorId", "displayName email")
        .lean(),
      Contribution.countDocuments(filter),
    ]);

    return res.json({ contributions, page, limit, total });
  } catch (err) {
    req.log.error({ err }, "[AdminContribution] listContributionsAdmin failed");
    return res.status(500).json({ error: "Failed to load contributions." });
  }
}

// ── POST /api/admin/contributions/:id/approve ───────────────────────────────
export async function approveContributionAdmin(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const result = await approveContributionService({
      contributionId: req.params.id,
      reviewerId: req.userDoc._id,
    });

    if (!result.approved) {
      return res.status(409).json({
        error: "Contribution not found or not pending review.",
        reason: result.reason,
      });
    }

    recordAdminAction({
      adminDoc: req.userDoc,
      action: "contribution.approve",
      targetType: "Contribution",
      targetId: req.params.id,
      details: { rewardStatus: result.rewardStatus },
    });

    return res.json(result);
  } catch (err) {
    req.log.error({ err }, "[AdminContribution] approveContributionAdmin failed");
    return res.status(500).json({ error: "Failed to approve contribution." });
  }
}

// ── POST /api/admin/contributions/:id/reject ─────────────────────────────────
// Body already validated by validateBody(ContributionRejectSchema)
// (routes/admin.js) before this handler runs.
export async function rejectContributionAdmin(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const result = await rejectContributionService({
      contributionId: req.params.id,
      reviewerId: req.userDoc._id,
      reason: req.body.reason,
    });

    if (!result.rejected) {
      return res.status(409).json({
        error: "Contribution not found or not pending review.",
        reason: result.reason,
      });
    }

    recordAdminAction({
      adminDoc: req.userDoc,
      action: "contribution.reject",
      targetType: "Contribution",
      targetId: req.params.id,
      details: { reason: req.body.reason },
    });

    return res.json(result);
  } catch (err) {
    req.log.error({ err }, "[AdminContribution] rejectContributionAdmin failed");
    return res.status(500).json({ error: "Failed to reject contribution." });
  }
}

// ── POST /api/admin/contributions/retry-rewards ──────────────────────────────
// Idempotent reconciliation, not a direct ledger write — mirrors
// controllers/adminReferralController.js's retryReferralRewards exactly.
// Body already validated by validateBody(ContributionRetrySchema)
// (routes/admin.js) before this handler runs.
export async function retryContributionRewardsAdmin(req, res) {
  try {
    const { limit } = req.body;
    const result = await retryPendingContributionRewards(limit ? { limit } : {});

    recordAdminAction({
      adminDoc: req.userDoc,
      action: "contribution.retry_rewards",
      targetType: "Contribution",
      targetId: null,
      details: result,
    });

    return res.json(result);
  } catch (err) {
    req.log.error({ err }, "[AdminContribution] retryContributionRewardsAdmin failed");
    return res.status(500).json({ error: "Failed to retry contribution rewards." });
  }
}