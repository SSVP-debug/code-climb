/**
 * routes/opportunities.js — public Opportunity Radar API.
 * Mounted in server.js WITHOUT requireAuth: PART 6 requires
 * /opportunities and /opportunities/:ccId to be reachable by anyone,
 * matching how routes/leaderboard.js and routes/stats.js are already
 * mounted public in this codebase.
 */
import { Router } from "express";
import { validateBody } from "../middleware/validateBody.js";
import { ApplyClickTrackSchema } from "../schemas/opportunitySchema.js";
import { OPPORTUNITY_RADAR_ENABLED } from "../config/featureFlags.js";
import {
  listOpportunities,
  getOpportunity,
  trackView,
  trackApplyClick,
} from "../controllers/opportunityController.js";

const router = Router();

// Feature flag gate — mirrors MONETIZATION_ENABLED/B2B_ENABLED convention
// in featureFlags.js. Default off until the admin team has real curated
// content ready to publish.
router.use((req, res, next) => {
  if (!OPPORTUNITY_RADAR_ENABLED) {
    return res.status(404).json({ error: "Opportunity Radar is not enabled." });
  }
  next();
});

router.get("/", listOpportunities);
router.get("/:ccId", getOpportunity);
router.post("/:ccId/view", trackView);
router.post("/:ccId/apply-click", validateBody(ApplyClickTrackSchema), trackApplyClick);

export default router;
