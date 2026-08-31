import { Router } from "express";
import { validateBody } from "../middleware/validateBody.js";
import { RedemptionRequestSchema } from "../schemas/rewardStoreSchema.js";
import {
  listStoreItems,
  requestRedemptionController,
  getMyRedemptions,
  cancelMyRedemption,
} from "../controllers/rewardStoreController.js";

/**
 * routes/rewardStore.js — Rewards Store (Phase 4), self-service
 * endpoints. Mounted with requireAuth + apiLimiter in server.js, same as
 * every other authenticated-only route file (see that file's mount
 * block) — same convention routes/contributions.js's own header comment
 * describes.
 *
 * Mounted at /api/reward-store rather than nested under the existing
 * /api/rewards router (routes/rewards.js — balance/ledger only) to keep
 * that file's narrow "read-only over the ledger" scope intact rather
 * than growing it into a second, unrelated concern.
 *
 * Admin catalog management + fulfillment-queue endpoints are NOT here —
 * they're registered in routes/admin.js alongside every other
 * requireAdmin route, matching that file's existing
 * flat-router-with-per-route-requireAdmin convention rather than
 * introducing a second admin-mounting pattern for this feature.
 */
const router = Router();

router.get("/items", listStoreItems);
router.post("/redemptions", validateBody(RedemptionRequestSchema), requestRedemptionController);
router.get("/redemptions/mine", getMyRedemptions);
router.post("/redemptions/:id/cancel", cancelMyRedemption);

export default router;