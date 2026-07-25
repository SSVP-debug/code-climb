import express from "express";
import {
  getProblems,
  getProblemBySlug,
  getAcceptanceRates,
} from "../controllers/problemController.js";
import editorialRoutes from "./editorial.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getProblems);
router.get("/stats/acceptance", getAcceptanceRates);
// optionalAuth (not requireAuth): this route stays reachable without a
// session, but when a valid one IS present, req.userDoc.solvedSlugs feeds
// the "Next Best Problem" recommendation (see problemController.js /
// services/recommendation/) so it can skip already-solved problems.
router.get("/:slug", optionalAuth, getProblemBySlug);

// Editorial endpoints require authentication
router.use("/:slug/editorial", requireAuth, editorialRoutes);

export default router;