import { Router } from "express";

import {
  getDailyQuizStatus,
  completeDailyQuiz,
} from "../controllers/dailyQuizController.js";

// requireAuth + apiLimiter are applied where this router is mounted
// (server.js), same convention as routes/dailyChallenge.js.
const router = Router();

router.get("/status", getDailyQuizStatus);
router.post("/complete", completeDailyQuiz);

export default router;
