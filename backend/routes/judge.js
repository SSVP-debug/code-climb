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
import { judgeRunLimiter } from "../middleware/rateLimiter.js";

const router = Router();

const submitSchema = z.object({
  problemSlug: z
    .string({ error: "problemSlug is required" })
    .min(1).max(200)
    .regex(/^[a-z0-9-]+$/, "Invalid problemSlug format"),

  code: z
    .string({ error: "code is required" })
    .min(1, "Code cannot be empty")
    .max(50_000, "Code exceeds the 50,000 character limit"),

  language: z.enum(["python", "javascript", "java", "cpp"], {
    error: () => "language must be: python, javascript, java, or cpp",
  }),

  // Accepted but IGNORED server-side once the problem is loaded —
  // submitHandler always overwrites this with problem.functionName, the
  // same "never trust the client for the execution contract" model
  // already used for returnType/comparisonMode/operationSequence below
  // in this file (see judgeController.js submitHandler). Kept optional
  // (not required) so an old/mismatched client value can never itself
  // cause a 400 here — the contract that actually matters is resolved
  // from Problem, not from this field.
  functionName: z
    .string()
    .min(1).max(100)
    .optional(),

  visibletestcases: z
    .array(z.object({
      input: z.record(z.unknown()),
      expectedOutput: z.unknown(),
    }))
    .max(20)
    .optional()
    .default([]),

  // Optional contest context (Fest Readiness Audit, P0-1). Absent/undefined
  // for ordinary practice submissions — the overwhelming majority. When
  // present, controllers/judgeController.js only ever uses it to ATTEMPT
  // contest credit after independently computing Accepted itself; the
  // client's inclusion of a contestId here grants nothing by itself. Loose
  // Mongo ObjectId shape check only — invalid/unrelated values simply fail
  // to match any real contest later and are treated as "not eligible."
  contestId: z
    .string()
    .regex(/^[a-f0-9]{24}$/i, "Invalid contestId")
    .optional(),
});

const runSchema = z.object({
  code: z
    .string({ error: "code is required" })
    .min(1).max(50_000),

  language: z.enum(["python", "javascript", "java", "cpp"], {
    error: () => "language must be: python, javascript, java, or cpp",
  }),

  // Optional as of the P1-1 server-side-resolution fix below: when
  // `problemSlug` is provided, runHandler resolves functionName itself
  // from the problem's own record and never looks at this field (see
  // problemSlug's doc comment). It's only actually REQUIRED for the
  // "no problemSlug" fallback path — enforced below by the
  // `.refine(...)`, not here, because a plain `z.string()` can't express
  // "required unless this other field is present."
  //
  // Root cause of the "single-number" incident (Fri Aug 13 postmortem):
  // src/services/judgeService.js's runTestcases() was deliberately
  // changed to stop sending functionName once problemSlug-based
  // server-side resolution shipped, but this field was left REQUIRED
  // here — so validateBody(runSchema) rejected every real Run request
  // with a 400 before runHandler's resolution logic ever ran. The
  // schema and the handler had silently drifted apart. See
  // docs/execution-contract.md for the full writeup and the contract
  // test (judge.contract.test.js) added to prevent this class of bug
  // from recurring.
  functionName: z
    .string()
    .min(1).max(100)
    .optional(),

  testcases: z
    .array(z.object({
      input: z.record(z.unknown()),
      expectedOutput: z.unknown(),
    }))
    .min(1, "At least one testcase required")
    .max(10),

  // Declared return type for java/cpp (e.g. "long", "long long"), from the
  // problem's contract. Optional — omitted for python/javascript or for
  // problems without a declared contract. Used only when problemSlug
  // (below) is omitted; when a real problem is loaded server-side, its own
  // stored contract takes precedence over anything client-sent — see
  // controllers/judgeController.js's runHandler.
  returnType: z.string().max(50).optional(),

  // Optional problem reference. src/services/judgeService.js's
  // runTestcases() always sends this for a real problem, so runHandler can
  // resolve functionName/returnType/comparisonMode server-side (the same
  // trust model submitHandler already used) instead of trusting whatever
  // the client sent for those fields. This was previously missing from
  // this schema entirely, so it was silently stripped by validateBody
  // before ever reaching the handler — meaning that server-side contract
  // resolution, and the contest-visibility gate that depends on it (Fest
  // Readiness Audit, P0-2), never actually ran. Fixed here.
  problemSlug: z
    .string()
    .min(1).max(200)
    .regex(/^[a-z0-9-]+$/, "Invalid problemSlug format")
    .optional(),
}).refine(
  (data) => Boolean(data.problemSlug) || Boolean(data.functionName),
  {
    // Mirrors runHandler's own fallback logic exactly: functionName is
    // only actually needed here when there's no problemSlug for the
    // server to resolve it from. Attached to the `functionName` path so
    // validateBody's "first error" surfaces a field the client can
    // actually act on, instead of a bare object-level error.
    message: "functionName is required when problemSlug is not provided",
    path: ["functionName"],
  }
);

// Fest Readiness Audit, P1-2: Run gets its own tighter limiter on top of the
// apiLimiter already applied to the whole /api/judge router (see
// server.js) — Submit deliberately keeps just the shared, more permissive
// one. See middleware/rateLimiter.js's judgeRunLimiter doc comment.
router.post("/run", judgeRunLimiter, validateBody(runSchema), runHandler);
router.post("/submit", validateBody(submitSchema), submitHandler);

// Exported (not just used internally) so tests can assert directly
// against the real validation contract instead of only against
// runHandler/submitHandler in isolation — see judge.contract.test.js.
// Named exports for schema objects follow the same testability
// convention already used for route handlers (judgeController.js's
// runHandler/submitHandler) — see judge.test.js / runHandler.test.js.
export { runSchema, submitSchema };

export default router;