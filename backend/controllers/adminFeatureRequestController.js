import FeatureRequest from "../models/FeatureRequest.js";
import {
  updateFeatureRequestStatus as updateFeatureRequestStatusService,
  retryPendingFeatureRequestRewards,
} from "../services/featureRequests.js";
import { recordAdminAction } from "../services/adminAuditLog.js";

/**
 * controllers/adminFeatureRequestController.js — admin status management
 * and reward-retry reconciliation for Feature Requests (Phase 5).
 * Mirrors controllers/adminContributionController.js's shape (thin
 * controller, all the actual state-transition/idempotency logic lives in
 * services/featureRequests.js).
 *
 * Listing goes straight to the FeatureRequest model, not through
 * services/featureRequests.js's listFeatureRequests() — that function is
 * built for the public board (excludes "withdrawn" by default, no way to
 * ask for literally every status at once) where the admin console needs
 * the opposite: every status visible, "withdrawn" included, for genuine
 * oversight. Same "admin listing goes straight to the model, no
 * service-layer indirection for a plain read" posture
 * adminRewardStoreController.js's own header comment already documents
 * for catalog CRUD.
 */

// ── GET /api/admin/feature-requests?status=&sort=&page=&limit= ─────────────
// No default status filter (unlike Contribution's queue, which defaults
// to "pending") — a public roadmap board's admin view needs to see
// every status at a glance, not just an intake queue, since most of the
// lifecycle here (planned/in_progress) isn't a one-shot review action.
export async function listFeatureRequestsAdmin(req, res) {
  try {
    const { status } = req.query;
    const sort = req.query.sort === "recent" ? { createdAt: -1 } : { voteCount: -1, createdAt: -1 };
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 20, 100);
    const filter = status ? { status } : {};

    const [featureRequests, total] = await Promise.all([
      FeatureRequest.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("submittedBy", "displayName email")
        .lean(),
      FeatureRequest.countDocuments(filter),
    ]);

    return res.json({ featureRequests, page, limit, total });
  } catch (err) {
    req.log.error({ err }, "[AdminFeatureRequest] listFeatureRequestsAdmin failed");
    return res.status(500).json({ error: "Failed to load feature requests." });
  }
}

// ── POST /api/admin/feature-requests/:id/status ─────────────────────────────
// Body already validated by validateBody(FeatureRequestStatusUpdateSchema)
// (routes/admin.js) — the schema itself restricts `status` to the
// admin-settable subset (planned/in_progress/shipped/declined), so this
// handler never needs to re-check that "open"/"withdrawn" weren't sent.
export async function updateFeatureRequestStatusAdmin(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const { status } = req.body;
    const result = await updateFeatureRequestStatusService({
      featureRequestId: req.params.id,
      status,
      reviewerId: req.userDoc._id,
    });

    if (!result.updated) {
      return res.status(409).json({
        error: "Feature request not found or already in a terminal status.",
        reason: result.reason,
      });
    }

    recordAdminAction({
      adminDoc: req.userDoc,
      action: "feature_request.update_status",
      targetType: "FeatureRequest",
      targetId: req.params.id,
      details: { status, rewardStatus: result.rewardStatus },
    });

    return res.json(result);
  } catch (err) {
    req.log.error({ err }, "[AdminFeatureRequest] updateFeatureRequestStatusAdmin failed");
    return res.status(500).json({ error: "Failed to update feature request status." });
  }
}

// ── POST /api/admin/feature-requests/retry-rewards ──────────────────────────
// Idempotent reconciliation, not a direct ledger write — mirrors
// controllers/adminContributionController.js's retryContributionRewardsAdmin
// exactly. Body already validated by validateBody(FeatureRequestRetrySchema)
// (routes/admin.js).
export async function retryFeatureRequestRewardsAdmin(req, res) {
  try {
    const { limit } = req.body;
    const result = await retryPendingFeatureRequestRewards(limit ? { limit } : {});

    recordAdminAction({
      adminDoc: req.userDoc,
      action: "feature_request.retry_rewards",
      targetType: "FeatureRequest",
      targetId: null,
      details: result,
    });

    return res.json(result);
  } catch (err) {
    req.log.error({ err }, "[AdminFeatureRequest] retryFeatureRequestRewardsAdmin failed");
    return res.status(500).json({ error: "Failed to retry feature request rewards." });
  }
}