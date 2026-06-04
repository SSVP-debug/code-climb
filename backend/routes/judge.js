import { Router } from "express";
import { z } from "zod";
import { validateBody } from "./compiler.js";
import { callJudge0 } from "../controllers/compilerController.js";
import hiddenTestcases from "../data/hiddenTestcases.js";

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

  visibleTestcases: z
    .array(z.object({
      input: z.record(z.unknown()),
      expectedOutput: z.unknown(),
    }))
    .max(20)
    .optional()
    .default([]),
});

function normalizeOutput(output) {
  return String(output ?? "").trim().replace(/\s+/g, "");
}

const languageIdMap = {
  python: 71, javascript: 63, java: 62, cpp: 54,
};

router.post("/submit", validateBody(submitSchema), async (req, res) => {
  const { problemSlug, code, language, functionName, visibleTestcases } = req.body;
  const isDev = process.env.NODE_ENV !== "production";

  // ── Load hidden testcases ──────────────────────────────────────────────
  const hidden = hiddenTestcases[problemSlug];

  if (!hidden || hidden.length === 0) {
    return res.status(404).json({
      error: `No hidden testcases configured for problem: "${problemSlug}". ` +
        `Add it to backend/data/hiddenTestcases.js`,
    });
  }

  const languageId = languageIdMap[language];
  const allTestcases = [...visibleTestcases, ...hidden];

  // ── CRITICAL GUARD: empty testcases → would silently return Accepted ──
  if (allTestcases.length === 0) {
    console.error(`[Judge] No testcases found for "${problemSlug}"`);
    return res.status(500).json({
      error: `Judge has no testcases to run for "${problemSlug}".`,
    });
  }

  if (isDev) {
    console.log(
      `[Judge] "${problemSlug}" — ${visibleTestcases.length} visible + ` +
      `${hidden.length} hidden = ${allTestcases.length} total | lang=${language}`
    );
  }

  const startTime = Date.now();
  let passedCount = 0;
  let visiblePassed = 0;
  let hiddenPassed = 0;

  try {
    for (const [index, testcase] of allTestcases.entries()) {
      const isVisible = index < visibleTestcases.length;

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
        console.error(`[Judge] callJudge0 threw on testcase ${index}:`, callErr.message);
        return res.json({
          status: "Judge Error ❌",
          passed: passedCount,
          total: allTestcases.length,
          error: callErr.message,
        });
      }

      if (!result) {
        return res.json({
          status: "Judge Error ❌",
          passed: passedCount,
          total: allTestcases.length,
          error: "Judge0 returned no result",
        });
      }

      // ── Compile error ────────────────────────────────────────────────
      if (result.compile_output) {
        return res.json({
          status: "Compilation Error ❌",
          passed: passedCount,
          total: allTestcases.length,
          error: result.compile_output,
        });
      }

      // ── Runtime / infra error ─────────────────────────────────────────
      if (result.stderr) {
        const isInfra = /code runner unavailable|ECONNREFUSED|502|fetch failed/i.test(result.stderr);
        return res.json({
          status: isInfra ? "Judge Error ❌" : "Runtime Error ❌",
          passed: passedCount,
          total: allTestcases.length,
          error: result.stderr,
        });
      }

      // ── Output comparison ─────────────────────────────────────────────
      const expected = normalizeOutput(JSON.stringify(testcase.expectedOutput));
      const actual = normalizeOutput(result.stdout || "");

      if (isDev) {
        console.log(
          `[Judge] Testcase ${index + 1}/${allTestcases.length} ` +
          `(${isVisible ? "visible" : "hidden"}) | ` +
          `expected="${expected}" actual="${actual}" match=${expected === actual}`
        );
      }
      console.log("TESTCASE:", testcase.input);
      console.log("EXPECTED:", expected);
      console.log("ACTUAL:", actual);
      console.log("RAW STDOUT:", result.stdout);

      if (expected !== actual) {
        return res.json({
          status: "Wrong Answer ❌",
          passed: passedCount,
          total: allTestcases.length,
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
      console.log(`[Judge] "${problemSlug}" → Accepted (${passedCount}/${allTestcases.length})`);
    }

    return res.json({
      status: "Accepted 🎉",
      passed: passedCount,
      total: allTestcases.length,
      visiblePassed,
      hiddenPassed,
      executionTime: String(Date.now() - startTime),
    });

  } catch (err) {
    console.error("[Judge] Unhandled error:", err.message);
    return res.json({
      status: "Judge Error ❌",
      passed: passedCount,
      total: allTestcases.length,
      error: "An unexpected error occurred during judging.",
    });
  }
});

export default router;