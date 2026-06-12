import { Router } from "express";
import { getInsights } from "../controllers/insightsController.js";

const router = Router();

// GET /api/insights — returns personalised Claude coaching for the authed user
router.get("/", getInsights);

export default router;
