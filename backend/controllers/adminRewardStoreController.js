import RewardCatalogItem from "../models/RewardCatalogItem.js";
import RewardRedemption from "../models/RewardRedemption.js";
import { fulfillRedemption, rejectRedemption } from "../services/rewardStore.js";
import { recordAdminAction } from "../services/adminAuditLog.js";

/**
 * controllers/adminRewardStoreController.js — admin catalog management
 * and fulfillment queue for Rewards Store (Phase 4). Mirrors
 * controllers/adminContributionController.js's shape (thin controller,
 * the actual state-transition/idempotency logic lives in
 * services/rewardStore.js) since that's the closest "admin reviews a
 * user-generated row that touches RewardLedger" precedent in this
 * codebase.
 *
 * Catalog CRUD (create/update) is intentionally direct-to-model here
 * rather than routed through a service function — see
 * services/rewardStore.js's own header comment for why that scope
 * decision was made: a plain create/edit/deactivate doesn't have the
 * kind of race-safety or multi-step orchestration concerns the
 * redemption lifecycle does, so a service-layer indirection wouldn't be
 * pulling its weight here (same reasoning e.g.
 * adminProblemController.js's createProblem/updateProblem also go
 * straight to the Problem model without an intermediate service file).
 */

// ── GET /api/admin/reward-store/items?status=all ────────────────────────────
// Defaults to "all" (active + inactive) — the admin's own catalog
// management view needs to see disabled items too, unlike the
// student-facing listStoreItems() (rewardStoreController.js), which is
// hardcoded to active-only.
export async function listCatalogItemsAdmin(req, res) {
  try {
    const status = req.query.status || "all";
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 20, 100);

    const filter = status === "all" ? {} : { active: status === "active" };

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
    req.log.error({ err }, "[AdminRewardStore] listCatalogItemsAdmin failed");
    return res.status(500).json({ error: "Failed to load catalog items." });
  }
}

// ── POST /api/admin/reward-store/items ───────────────────────────────────────
// Body already validated by validateBody(CatalogItemCreateSchema)
// (routes/admin.js) before this handler runs.
export async function createCatalogItemAdmin(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const item = await RewardCatalogItem.create({ ...req.body, createdBy: req.userDoc._id });

    recordAdminAction({
      adminDoc: req.userDoc,
      action: "reward_store.create_item",
      targetType: "RewardCatalogItem",
      targetId: item._id,
      details: { name: item.name, costCredits: item.costCredits },
    });

    return res.status(201).json({ item });
  } catch (err) {
    req.log.error({ err }, "[AdminRewardStore] createCatalogItemAdmin failed");
    return res.status(500).json({ error: "Failed to create catalog item." });
  }
}

// ── PATCH /api/admin/reward-store/items/:id ──────────────────────────────────
// Body already validated by validateBody(CatalogItemUpdateSchema)
// (routes/admin.js) before this handler runs — a partial update, so an
// empty/unchanged body is valid (no-op) rather than an error.
export async function updateCatalogItemAdmin(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const item = await RewardCatalogItem.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!item) {
      return res.status(404).json({ error: "Catalog item not found." });
    }

    recordAdminAction({
      adminDoc: req.userDoc,
      action: "reward_store.update_item",
      targetType: "RewardCatalogItem",
      targetId: item._id,
      details: { fields: Object.keys(req.body) },
    });

    return res.json({ item });
  } catch (err) {
    req.log.error({ err }, "[AdminRewardStore] updateCatalogItemAdmin failed");
    return res.status(500).json({ error: "Failed to update catalog item." });
  }
}

// ── GET /api/admin/reward-store/redemptions?status=pending ──────────────────
// Defaults to the fulfillment queue (status=pending) since that's the
// overwhelming common case for this endpoint — same "default to the
// actionable view, allow any status for audit" convention
// listContributionsAdmin already uses.
export async function listRedemptionsAdmin(req, res) {
  try {
    const status = req.query.status || "pending";
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 20, 100);

    const filter = status === "all" ? {} : { status };

    const [redemptions, total] = await Promise.all([
      RewardRedemption.find(filter)
        .sort({ createdAt: 1 }) // oldest-first — a fulfillment queue, not a feed
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("userId", "displayName email")
        .lean(),
      RewardRedemption.countDocuments(filter),
    ]);

    return res.json({ redemptions, page, limit, total });
  } catch (err) {
    req.log.error({ err }, "[AdminRewardStore] listRedemptionsAdmin failed");
    return res.status(500).json({ error: "Failed to load redemptions." });
  }
}

// ── POST /api/admin/reward-store/redemptions/:id/fulfill ────────────────────
// Body already validated by validateBody(RedemptionFulfillSchema)
// (routes/admin.js) before this handler runs.
export async function fulfillRedemptionAdmin(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const result = await fulfillRedemption({
      redemptionId: req.params.id,
      reviewerId: req.userDoc._id,
      adminNotes: req.body.adminNotes,
    });

    if (!result.fulfilled) {
      return res.status(409).json({
        error: "Redemption not found or not pending.",
        reason: result.reason,
      });
    }

    recordAdminAction({
      adminDoc: req.userDoc,
      action: "reward_store.fulfill_redemption",
      targetType: "RewardRedemption",
      targetId: req.params.id,
      details: { adminNotes: req.body.adminNotes },
    });

    return res.json(result);
  } catch (err) {
    req.log.error({ err }, "[AdminRewardStore] fulfillRedemptionAdmin failed");
    return res.status(500).json({ error: "Failed to fulfill redemption." });
  }
}

// ── POST /api/admin/reward-store/redemptions/:id/reject ─────────────────────
// Body already validated by validateBody(RedemptionRejectSchema)
// (routes/admin.js) before this handler runs.
export async function rejectRedemptionAdmin(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const result = await rejectRedemption({
      redemptionId: req.params.id,
      reviewerId: req.userDoc._id,
      reason: req.body.reason,
    });

    if (!result.rejected) {
      return res.status(409).json({
        error: "Redemption not found or not pending.",
        reason: result.reason,
      });
    }

    recordAdminAction({
      adminDoc: req.userDoc,
      action: "reward_store.reject_redemption",
      targetType: "RewardRedemption",
      targetId: req.params.id,
      details: { reason: req.body.reason },
    });

    return res.json(result);
  } catch (err) {
    req.log.error({ err }, "[AdminRewardStore] rejectRedemptionAdmin failed");
    return res.status(500).json({ error: "Failed to reject redemption." });
  }
}