/**
 * Judge routes — thin wiring only. Grading logic lives in
 * controllers/judgeController.js (Staff review §2/§9: this file used to
 * mix pure helper functions, a testable handler, and route registration
 * in one 475-line file). Zod schemas stay here, matching the existing
 * convention (see routes/compiler.js, which keeps its own schema +
 * validateBody together too).
 */
import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validateBody.js";
import { runHandler, submitHandler } from "../controllers/judgeController.js";

const router = Router();

const submitSchema = z.object({
  problemSlug: z
    .string({ required_error: "problemSlug is required" })
    .min(1).max(200)
    .regex(/^[a-z0-9-]+$/, "Invalid problemSlug format"),

  code: z
    .string({ required_error: "code is required" })
    .min(1, "Code cannot be empty")
    .max(50_000, "Code exceeds the 50,000 character limit"),

  language: z.enum(["python", "javascript", "java", "cpp"], {
    errorMap: () => ({ message: "language must be: python, javascript, java, or cpp" }),
  }),

  functionName: z
    .string({ required_error: "functionName is required" })
    .min(1).max(100),

  visibletestcases: z
    .array(z.object({
      input: z.record(z.unknown()),
      expectedOutput: z.unknown(),
    }))
    .max(20)
    .optional()
    .default([]),
});

const runSchema = z.object({
  code: z
    .string({ required_error: "code is required" })
    .min(1).max(50_000),

  language: z.enum(["python", "javascript", "java", "cpp"], {
    errorMap: () => ({ message: "language must be: python, javascript, java, or cpp" }),
  }),

  functionName: z
    .string({ required_error: "functionName is required" })
    .min(1).max(100),

  testcases: z
    .array(z.object({
      input: z.record(z.unknown()),
      expectedOutput: z.unknown(),
    }))
    .min(1, "At least one testcase required")
    .max(10),

  // Declared return type for java/cpp (e.g. "long", "long long"), from the
  // problem's contract. Optional — omitted for python/javascript or for
  // problems without a declared contract. Run mode has no server-side
  // problem lookup, so this travels from the frontend, which already has
  // the full problem object loaded. Submit mode does NOT accept this from
  // the client — it derives it server-side from the stored Problem document.
  returnType: z.string().max(50).optional(),
});

router.post("/run", validateBody(runSchema), runHandler);
router.post("/submit", validateBody(submitSchema), submitHandler);

export default router;