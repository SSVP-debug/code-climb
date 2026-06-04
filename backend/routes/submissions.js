import { Router } from "express";
import { z } from "zod";
import {
  createSubmission,
  listSubmissions,
} from "../controllers/submissionController.js";
import { validateBody } from "./compiler.js";

const router = Router();

// ── Validation schema ────────────────────────────────────────────────────────
const createSubmissionSchema = z.object({
  // Problem identifier
  problemSlug: z
    .string({ required_error: "problemSlug is required" })
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "problemSlug must be lowercase letters, numbers, and hyphens"),

  // Language must be one of the four supported languages
  language: z.enum(["python", "javascript", "java", "cpp"], {
    errorMap: () => ({
      message: "language must be one of: python, javascript, java, cpp",
    }),
  }),

  // The submitted source code (same limit as compiler route)
  code: z
    .string({ required_error: "code is required" })
    .min(1, "Code cannot be empty")
    .max(50_000, "Code exceeds the 50,000 character limit"),

  // Judge result status string (e.g. "Accepted 🎉", "Wrong Answer ❌")
  status: z
    .string({ required_error: "status is required" })
    .min(1)
    .max(100),

  // Output from the judge (stdout/stderr)
  output: z.string().max(10_000).optional().default(""),

  // Test case counts
  passed: z.number().int().min(0).optional().default(0),
  total:  z.number().int().min(0).optional().default(0),

  // Optional timing metadata from Judge0
  executionTime: z.string().max(20).optional().nullable(),
});

// ── Routes ────────────────────────────────────────────────────────────────────
router.get("/",  listSubmissions);
router.post("/", validateBody(createSubmissionSchema), createSubmission);

export default router;
