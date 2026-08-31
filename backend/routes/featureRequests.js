import { Router } from "express";
import { validateBody } from "../middleware/validateBody.js";
import {
  FeatureRequestCreateSchema,
  FeatureRequestUpdateSchema,
} from "../schemas/featureRequestSchema.js";
import {
  submitFeatureRequest,
  listFeatureRequestsPublic,
  getMyFeatureRequestsController,
  voteFeatureRequestController,
  editFeatureRequestController,
  withdrawFeatureRequestController,
} from "../controllers/featureRequestController.js";

/**
 * routes/featureRequests.js — Feature Requests (Phase 5), self-service
 * endpoints. Mounted with requireAuth + apiLimiter in server.js, same as
 * every other authenticated-only route file — open to any authenticated
 * role, not gated to a specific one, per Bunny's own scoping decision.
 *
 * Admin status-management endpoints are NOT here — they're registered in
 * routes/admin.js alongside every other requireAdmin route, matching
 * that file's existing flat-router-with-per-route-requireAdmin
 * convention (see its Contribution Infrastructure section) rather than
 * introducing a second admin-mounting pattern for one feature.
 */
const router = Router();

router.post("/", validateBody(FeatureRequestCreateSchema), submitFeatureRequest);
router.get("/", listFeatureRequestsPublic);
router.get("/mine", getMyFeatureRequestsController);
router.post("/:id/vote", voteFeatureRequestController);
router.patch("/:id", validateBody(FeatureRequestUpdateSchema), editFeatureRequestController);
router.post("/:id/withdraw", withdrawFeatureRequestController);

export default router;