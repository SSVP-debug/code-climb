import { Router } from "express";
import { z } from "zod";
import { runCode } from "../controllers/compilerController.js";
import { compilerRateLimiter } from "../middleware/compilerRateLimiter.js";
import { validateBody } from "../middleware/validateBody.js";
import { ENABLED_LANGUAGE_IDS } from "../config/languages.js";
import { optionalAuth } from "../middleware/auth.js";

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
  //
  // Content & Execution Architecture, Phase 2: this now checks
  // ENABLED_LANGUAGE_IDS rather than SUPPORTED_LANGUAGE_IDS — a language
  // that's registered but currently disabled (e.g. `enabled: false` in
  // config/languages.js) is rejected here the same way an entirely
  // unsupported one always was, so disabling a language actually blocks
  // this "Run Code" surface too, not just the problem-bound Run/Submit in
  // routes/judge.js. The error message intentionally keeps saying
  // "supported languages" (not "enabled languages") — from a caller's
  // perspective the two are indistinguishable, and rewording it isn't
  // worth breaking the existing message shape other tooling may match on.
  language_id: z
    .number({ required_error: "language_id is required" })
    .int("language_id must be an integer")
    .positive("language_id must be a positive integer")
    .refine((id) => ENABLED_LANGUAGE_IDS.includes(id), {
      message: `language_id must be one of the supported languages: ${ENABLED_LANGUAGE_IDS.join(", ")}`,
    }),

  // stdin: optional custom input for Run Code
  stdin: z
    .string()
    .max(10_000, "Custom input exceeds the 10,000 character limit")
    .optional()
    .default(""),
});

// ── Routes ────────────────────────────────────────────────────────────────────
// Guest Mode: requireAuth is no longer applied at the server.js
// mount point (see server.js's own comment on the /api/compiler line) —
// this route now applies optionalAuth itself. controllers/compilerController.js's
// runCode was inspected line-by-line and confirmed stateless: it never
// reads or writes req.userDoc, only proxies (sourceCode, language_id,
// stdin) to Judge0 and returns the raw result — so it's safe for a guest
// caller. compilerRateLimiter already keys on userOrIpKey (middleware/
// rateLimiter.js), which falls back to per-IP limiting when there's no
// req.auth.uid, so a guest is still rate-limited (same 30/min as any other
// unauthenticated caller on this limiter — unlike /api/judge/run, this
// isn't split into a separate guest tier, since Interview Mode/Battle
// Rooms don't route through this endpoint and its existing limit was
// already IP-fallback-safe).
router.post(
  "/run",
  optionalAuth,
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
