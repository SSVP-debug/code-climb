import express from "express";
import {
  getProblems,
  getProblemBySlug,
  getAcceptanceRates,
} from "../controllers/problemController.js";
import editorialRoutes from "./editorial.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getProblems);
router.get("/stats/acceptance", getAcceptanceRates);
router.get("/:slug", getProblemBySlug);

// Editorial endpoints require authentication
router.use("/:slug/editorial", requireAuth, editorialRoutes);

export default router;