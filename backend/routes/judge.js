import { Router } from "express";
import { z } from "zod";
import { validateBody } from "./compiler.js";
import { callJudge0 } from "../controllers/compilerController.js";
import hiddenTestcases from "../data/hiddenTestcases.js";

const router = Router();

/**
 * Sanitize stderr output from Judge0 before sending to the client.
 * Strips internal system paths, env variable names, and other runtime
 * internals that shouldn't be exposed in a browser console.
 */
function sanitizeStderr(stderr) {
  if (!stderr) return null;

  return stderr
    .replace(/\/[a-zA-Z0-9._/-]{5,}/g, "[path]")
    .replace(/[A-Z]:\\[^\s]+/g, "[path]")
    .trim();
}

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

// ADD after the submitSchema definition (after line 36)

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
});

// ADD after the router.post("/submit", ...) block (after line 195)

router.post("/run", validateBody(runSchema), async (req, res) => {
  const { code, language, functionName, testcases } = req.body;
  const languageId = languageIdMap[language];
  const isDev = process.env.NODE_ENV !== "production";
  const results = [];

  for (const [index, testcase] of testcases.entries()) {
    let result;

    try {
      result = await callJudge0({
        sourceCode: code,
        language,
        languageId,
        testcaseInput: testcase.input,
        functionName,
      });
    } catch (callErr) {
      return res.json({
        error: callErr.message,
        results,
        compileFailed: false,
      });
    }

    // Compile error on first testcase aborts all — no point running rest
    if (result.compile_output) {
      return res.json({
        error: result.compile_output,
        compileFailed: true,
        results,
      });
    }

    const expected = normalizeOutput(
      JSON.stringify(testcase.expectedOutput)
    );

    const actual = normalizeOutput(
      result.stdout || ""
    );

    const passed = outputsMatch(expected, actual);
    const hasError = !!result.stderr;

    if (isDev) {
      console.log(`[Run] tc${index + 1} expected="${expected}" actual="${actual}" passed=${passed}`);
    }

    results.push({
      index,
      input: testcase.input,
      expected: testcase.expectedOutput,
      actual: result.stdout?.trim() ?? "",
      passed: hasError ? false : passed,
      error: sanitizeStderr(result.stderr),
      time: result.time ?? null,
      memory: result.memory ?? null,
    });

    // Runtime error: record it then stop — remaining testcases will also fail
    if (hasError) {
      return res.json({ results, compileFailed: false });
    }
  }

  return res.json({ results, compileFailed: false });
});

function normalizeOutput(output) {
  return String(output ?? "")
    .trim()
    .replace(/\r\n/g, "\n");
}

function outputsMatch(expected, actual) {
  try {
    return JSON.stringify(JSON.parse(expected))
      === JSON.stringify(JSON.parse(actual));
  } catch {
    return normalizeOutput(expected)
      === normalizeOutput(actual);
  }
}

const languageIdMap = {
  python: 71, javascript: 63, java: 62, cpp: 54,
};

router.post("/submit", validateBody(submitSchema), async (req, res) => {
  const { problemSlug, code, language, functionName, visibletestcases } = req.body;
  const isDev = process.env.NODE_ENV !== "production";

  // ── Load hidden testcases ──────────────────────────────────────────────
  const hidden = hiddenTestcases[problemSlug];

  if (!hidden || hidden.length === 0) {
    return res.status(404).json({
      error: `No hidden testcases configured for problem: "${problemSlug}". ` +
        `Add it to backend/data/hiddentestcases.js`,
    });
  }

  const languageId = languageIdMap[language];
  const alltestcases = [...visibletestcases, ...hidden];

  // ── CRITICAL GUARD: empty testcases → would silently return Accepted ──
  if (alltestcases.length === 0) {
    console.error(`[Judge] No testcases found for "${problemSlug}"`);
    return res.status(500).json({
      error: `Judge has no testcases to run for "${problemSlug}".`,
    });
  }

  if (isDev) {
    console.log(
      `[Judge] "${problemSlug}" — ${visibletestcases.length} visible + ` +
      `${hidden.length} hidden = ${alltestcases.length} total | lang=${language}`
    );
  }

  const startTime = Date.now();
  let passedCount = 0;
  let visiblePassed = 0;
  let hiddenPassed = 0;

  try {
    for (const [index, testcase] of alltestcases.entries()) {
      const isVisible = index < visibletestcases.length;

      // ── Run testcase through Judge0 ──────────────────────────────────
      let result;
      try {
        result = await callJudge0({
          sourceCode: code,
          language,
          languageId,
          testcaseInput: testcase.input,
          functionName,
        });
      } catch (callErr) {
        console.error(
          `[Judge] callJudge0 threw on testcase ${index}:`,
          callErr
        );
        return res.json({
          status: "Judge Error",
          passed: passedCount,
          total: alltestcases.length,
          error: callErr.message,
        });
      }

      if (!result) {
        return res.json({
          status: "Judge Error",
          passed: passedCount,
          total: alltestcases.length,
          error: "Judge0 returned no result",
        });
      }

      // ── Compile error ────────────────────────────────────────────────
      if (result.compile_output) {
        return res.json({
          status: "Compilation Error",
          passed: passedCount,
          total: alltestcases.length,
          error: result.compile_output,
        });
      }

      // ── Runtime / infra error ─────────────────────────────────────────
      if (result.stderr) {
        const isInfra = /code runner unavailable|ECONNREFUSED|502|fetch failed/i.test(result.stderr);
        return res.json({
          status: isInfra ? "Judge Error" : "Runtime Error",
          passed: passedCount,
          total: alltestcases.length,
          error: sanitizeStderr(result.stderr),
        });
      }

      // ── Output comparison ─────────────────────────────────────────────
      const expected = normalizeOutput(JSON.stringify(testcase.expectedOutput));
      const actual = normalizeOutput(result.stdout || "");

      const matched = outputsMatch(expected, actual);

      if (isDev) {
        console.log(
          `[Judge] Testcase ${index + 1}/${alltestcases.length} ` +
          `(${isVisible ? "visible" : "hidden"}) | ` +
          `expected="${expected}" actual="${actual}" match=${matched}`
        );
      }

      if (!matched(expected, actual)) {
        return res.json({
          status: "Wrong Answer",
          passed: passedCount,
          total: alltestcases.length,
          visiblePassed,
          hiddenPassed,
          executionTime: String(Date.now() - startTime),
          ...(isVisible ? {
            expectedOutput: testcase.expectedOutput,
            actualOutput: result.stdout || "",
          } : {}),
        });
      }

      passedCount++;
      if (isVisible) visiblePassed++;
      else hiddenPassed++;
    }

    if (isDev) {
      console.log(`[Judge] "${problemSlug}" → Accepted (${passedCount}/${alltestcases.length})`);
    }

    return res.json({
      status: "Accepted",
      passed: passedCount,
      total: alltestcases.length,
      visiblePassed,
      hiddenPassed,
      executionTime: String(Date.now() - startTime),
    });

  } catch (err) {
    console.error("[Judge] Unhandled error:", err);
    return res.json({
      status: "Judge Error",
      passed: passedCount,
      total: alltestcases.length,
      error: "An unexpected error occurred during judging.",
    });
  }
});

export default router;