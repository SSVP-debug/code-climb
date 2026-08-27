import { Router } from "express";
import { getMyBalance, getMyLedger } from "../controllers/rewardController.js";

/**
 * routes/rewards.js — Phase 2 architecture report §18.
 * Mounted with requireAuth in server.js, same as every other
 * authenticated-only route file (see that file's mount block).
 *
 * The admin-facing "any user's ledger" endpoint
 * (GET /api/admin/rewards/ledger) is NOT here — it's registered in
 * routes/admin.js alongside every other requireAdmin route, matching
 * that file's existing flat-router-with-per-route-requireAdmin
 * convention (see routes/admin.js's own mount list) rather than
 * introducing a second admin-mounting pattern for one endpoint.
 */
const router = Router();

router.get("/balance", getMyBalance);
router.get("/ledger", getMyLedger);

export default router;
