import { Router } from "express";
import { validateBody } from "../middleware/validateBody.js";
import { ContributionCreateSchema } from "../schemas/contributionSchema.js";
import { submitContribution, getMyContributions } from "../controllers/contributionController.js";

/**
 * routes/contributions.js — Contribution Infrastructure (Phase 2F),
 * self-service endpoints. Mounted with requireAuth + apiLimiter in
 * server.js, same as every other authenticated-only route file (see that
 * file's mount block) — same convention routes/rewards.js's own header
 * comment describes.
 *
 * Admin review/approval endpoints are NOT here — they're registered in
 * routes/admin.js alongside every other requireAdmin route, matching that
 * file's existing flat-router-with-per-route-requireAdmin convention
 * (see routes/admin.js's own Reward Ledger / Referral sections) rather
 * than introducing a second admin-mounting pattern for one feature.
 */
const router = Router();

router.post("/", validateBody(ContributionCreateSchema), submitContribution);
router.get("/mine", getMyContributions);

export default router;