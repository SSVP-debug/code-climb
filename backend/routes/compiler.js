import { Router } from "express";
import { z } from "zod";
import {
  runCode,
  submitSolution,
} from "../controllers/compilerController.js";


const router = Router();

// ── Validation schema ────────────────────────────────────────────────────────
const runCodeSchema = z.object({
  // source_code: the user's submitted code
  source_code: z
    .string({ required_error: "source_code is required" })
    .min(1, "Code cannot be empty")
    .max(50_000, "Code exceeds the 50,000 character limit"),

  // language_id: Judge0 language ID (e.g. 71 = Python, 63 = JS)
  language_id: z
    .number({ required_error: "language_id is required" })
    .int("language_id must be an integer")
    .positive("language_id must be a positive integer"),

  // stdin: optional custom input for Run Code
  stdin: z
    .string()
    .max(10_000, "Custom input exceeds the 10,000 character limit")
    .optional()
    .default(""),
});

// ── Reusable validation middleware ────────────────────────────────────────────
// Uses Zod's safeParse so it never throws — always returns a clean 400.
// Replaces req.body with the parsed + coerced data (e.g. default values applied).
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const firstError = result.error.issues?.[0];
      return res.status(400).json({
        error: firstError?.message || "Invalid request body",
        field: firstError?.path?.join(".") || undefined,
      });
    }

    // Replace req.body with the validated + coerced value
    req.body = result.data;
    next();
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────
// Note: requireAuth is applied at the server.js level via app.use("/api/compiler", ...)
// so it does not need to be repeated here.
router.post(
  "/run",
  compilerRateLimiter,
  validateBody(runCodeSchema),
  runCode
);

router.post(
  "/submit",
  compilerRateLimiter,
  submitSolution
);

export default router;
