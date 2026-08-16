import { Router } from "express";
import { z } from "zod";
import { runCode } from "../controllers/compilerController.js";
import { compilerRateLimiter } from "../middleware/compilerRateLimiter.js";
import { validateBody } from "../middleware/validateBody.js";
import { SUPPORTED_LANGUAGE_IDS } from "../config/languages.js";

const router = Router();

// ── Validation schema ────────────────────────────────────────────────────────
const runCodeSchema = z.object({
  // source_code: the user's submitted code
  source_code: z
    .string({ required_error: "source_code is required" })
    .min(1, "Code cannot be empty")
    .max(50_000, "Code exceeds the 50,000 character limit"),

  // language_id: Judge0 language ID. Previously validated only as "any
  // positive integer", which let a client forward an unsupported Judge0
  // language (e.g. Bash) through Code Club's proxy. Restricted to the
  // single allow-list in config/languages.js — Judge0 Integration
  // Hardening, item 1. Unsupported IDs are rejected here, before the
  // request ever reaches Judge0, not silently remapped to a supported one.
  language_id: z
    .number({ required_error: "language_id is required" })
    .int("language_id must be an integer")
    .positive("language_id must be a positive integer")
    .refine((id) => SUPPORTED_LANGUAGE_IDS.includes(id), {
      message: `language_id must be one of the supported languages: ${SUPPORTED_LANGUAGE_IDS.join(", ")}`,
    }),

  // stdin: optional custom input for Run Code
  stdin: z
    .string()
    .max(10_000, "Custom input exceeds the 10,000 character limit")
    .optional()
    .default(""),
});

// ── Routes ────────────────────────────────────────────────────────────────────
// Note: requireAuth is applied at the server.js level via app.use("/api/compiler", ...)
// so it does not need to be repeated here.
router.post(
  "/run",
  compilerRateLimiter,
  validateBody(runCodeSchema),
  runCode
);


// Exported for direct .safeParse() testing against the real schema — same
// pattern as routes/judge.js's runSchema/submitSchema (see
// routes/judge.contract.test.js) — rather than only being reachable via a
// full Express app + supertest, which this backend doesn't otherwise use.
export { runCodeSchema };

export default router;
