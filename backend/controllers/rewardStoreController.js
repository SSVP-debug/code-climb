import RewardCatalogItem from "../models/RewardCatalogItem.js";
import RewardRedemption from "../models/RewardRedemption.js";
import { requestRedemption, cancelRedemption } from "../services/rewardStore.js";

/**
 * controllers/rewardStoreController.js — student-facing endpoints for
 * Rewards Store (Phase 4). Mirrors controllers/contributionController.js's
 * split: self-service endpoints here, admin-facing catalog/fulfillment
 * endpoints in controllers/adminRewardStoreController.js + routes/admin.js
 * (that file's existing flat-router-with-per-route-requireAdmin
 * convention), not a second admin-mounting pattern for this feature
 * either.
 */

// ── GET /api/reward-store/items ─────────────────────────────────────────────
// Active items only, newest-first — this is the browsing/catalog view a
// student sees, not the admin's full (active + inactive) list, which is
// the separate, requireAdmin-gated endpoint in
// adminRewardStoreController.js.
export async function listStoreItems(req, res) {
  try {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 20, 100);

    const filter = { active: true };
    const [items, total] = await Promise.all([
      RewardCatalogItem.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      RewardCatalogItem.countDocuments(filter),
    ]);

    return res.json({ items, page, limit, total });
  } catch (err) {
    req.log.error({ err }, "[RewardStore] listStoreItems failed");
    return res.status(500).json({ error: "Failed to load the rewards store." });
  }
}

// ── POST /api/reward-store/redemptions ──────────────────────────────────────
// Body already shape-validated by validateBody(RedemptionRequestSchema)
// (routes/rewardStore.js) before this handler runs — but "was a
// shippingAddress required at all" is a service-layer decision (depends
// on the item, not the request body alone), so requestRedemption()'s own
// reason codes are what actually surface here, not just schema errors.
export async function requestRedemptionController(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const { itemId, shippingAddress } = req.body;
    const result = await requestRedemption({
      userId: req.userDoc._id,
      itemId,
      shippingAddress: shippingAddress ?? null,
    });

    if (!result.requested) {
      const status = result.reason === "item_not_found" ? 404 : 409;
      return res.status(status).json({
        error: "Unable to request this redemption.",
        reason: result.reason,
      });
    }

    return res.status(201).json({ redemption: result.redemption });
  } catch (err) {
    req.log.error({ err }, "[RewardStore] requestRedemptionController failed");
    return res.status(500).json({ error: "Failed to request redemption." });
  }
}

// ── GET /api/reward-store/redemptions/mine ──────────────────────────────────
// Always scoped to req.userDoc — never accepts a userId query param, same
// reasoning getMyLedger/getMyContributions already use throughout this
// codebase.
export async function getMyRedemptions(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 20, 100);

    const [redemptions, total] = await Promise.all([
      RewardRedemption.find({ userId: req.userDoc._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      RewardRedemption.countDocuments({ userId: req.userDoc._id }),
    ]);

    return res.json({ redemptions, page, limit, total });
  } catch (err) {
    req.log.error({ err }, "[RewardStore] getMyRedemptions failed");
    return res.status(500).json({ error: "Failed to load your redemptions." });
  }
}

// ── POST /api/reward-store/redemptions/:id/cancel ───────────────────────────
// services/rewardStore.js's cancelRedemption() itself scopes the update
// to { _id, status: "pending", userId } — a user can never cancel
// someone else's redemption even if they guess a valid :id, enforced at
// the DB-query level, not just by this controller trusting req.userDoc.
export async function cancelMyRedemption(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const result = await cancelRedemption({
      redemptionId: req.params.id,
      userId: req.userDoc._id,
    });

    if (!result.cancelled) {
      return res.status(409).json({
        error: "Redemption not found, not yours, or no longer pending.",
        reason: result.reason,
      });
    }

    return res.json(result);
  } catch (err) {
    req.log.error({ err }, "[RewardStore] cancelMyRedemption failed");
    return res.status(500).json({ error: "Failed to cancel redemption." });
  }
}