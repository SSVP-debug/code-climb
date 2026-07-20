import { Router } from "express";
import { z } from "zod";

import { validateBody } from "../middleware/validateBody.js";
import {
  completeDailyChallenge,
} from "../controllers/dailyChallengeController.js";

const router = Router();

const completeSchema = z.object({
  slug: z.string().min(1),
});

router.post(
  "/complete",
  validateBody(completeSchema),
  completeDailyChallenge
);

export default router;