import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validateBody.js";
import { createReflection } from "../controllers/reflectionController.js";
import { REFLECTION_RATINGS } from "../models/Reflection.js";

const router = Router();

const reflectionSchema = z.object({
  submissionId: z
    .string({ required_error: "submissionId is required" })
    .regex(/^[a-f0-9]{24}$/i, "Invalid submissionId"),

  difficultyRating: z.enum(REFLECTION_RATINGS, {
    errorMap: () => ({
      message: `difficultyRating must be one of: ${REFLECTION_RATINGS.join(", ")}`,
    }),
  }),
});

router.post("/", validateBody(reflectionSchema), createReflection);

export default router;
