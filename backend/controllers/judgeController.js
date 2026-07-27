import { callJudge0 } from "./compilerController.js";
import Problem from "../models/Problem.js";
import { recordVerifiedSubmission } from "./submissionController.js";

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

export async function runHandler(req, res) {
  const { code, language, functionName, testcases, returnType, comparisonMode, operationSequence } = req.body;
  const languageId = languageIdMap[language];
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
        returnType,
        operationSequence,
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

    const passed = outputsMatch(expected, actual, comparisonMode);
    const hasError = !!result.stderr;

    req.log.debug(
      { testcaseIndex: index + 1, expected, actual, passed },
      "[Run] Testcase result"
    );

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
}

function normalizeOutput(output) {
  return String(output ?? "")
    .trim()
    .replace(/\r\n/g, "\n");
}

// Canonical, order-independent key for one array element — used only to
// pair up elements between expected/actual when comparisonMode is
// "unordered". Sorting by JSON.stringify is enough to detect "same
// multiset of elements, different order"; it doesn't need to be a
// meaningful/natural sort, just a deterministic one so equal elements land
// at the same position on both sides.
function sortForUnorderedComparison(arr) {
  return [...arr].map((el) => JSON.stringify(el)).sort();
}

// `comparisonMode` — "exact" (default) or "unordered". "unordered" only
// relaxes ordering of the TOP-LEVEL array; nested structure within each
// element is still compared in its original order. See audit finding P0-3
// and Problem.comparisonMode's doc comment in backend/models/Problem.js.
function outputsMatch(expected, actual, comparisonMode = "exact") {
  try {
    const expectedParsed = JSON.parse(expected);
    const actualParsed = JSON.parse(actual);

    if (
      comparisonMode === "unordered" &&
      Array.isArray(expectedParsed) &&
      Array.isArray(actualParsed)
    ) {
      if (expectedParsed.length !== actualParsed.length) return false;

      return (
        JSON.stringify(sortForUnorderedComparison(expectedParsed)) ===
        JSON.stringify(sortForUnorderedComparison(actualParsed))
      );
    }

    return JSON.stringify(expectedParsed) === JSON.stringify(actualParsed);
  } catch {
    return normalizeOutput(expected)
      === normalizeOutput(actual);
  }
}

const languageIdMap = {
  python: 71, javascript: 63, java: 62, cpp: 54,
};

/**
 * Runs a single testcase through Judge0 and normalizes the outcome into a
 * uniform { index, isVisible, kind, ... } shape, regardless of whether
 * this call happens sequentially or concurrently with others. `kind` is
 * one of: "callError" | "noResult" | "compileError" | "infraError" |
 * "runtimeError" | "wrongAnswer" | "passed".
 */
async function runTestcase({ testcase, index, isVisible, code, language, languageId, functionName, returnType, comparisonMode, operationSequence }) {
  let result;
  try {
    result = await callJudge0({
      sourceCode: code,
      language,
      languageId,
      testcaseInput: testcase.input,
      functionName,
      returnType,
      operationSequence,
    });
  } catch (callErr) {
    return { index, isVisible, kind: "callError", error: callErr, errorMessage: callErr.message };
  }

  if (!result) {
    return { index, isVisible, kind: "noResult", errorMessage: "Judge0 returned no result" };
  }

  if (result.compile_output) {
    return { index, isVisible, kind: "compileError", errorMessage: result.compile_output };
  }

  if (result.stderr) {
    const isInfra = /code runner unavailable|ECONNREFUSED|502|fetch failed/i.test(result.stderr);
    return {
      index,
      isVisible,
      kind: isInfra ? "infraError" : "runtimeError",
      errorMessage: sanitizeStderr(result.stderr),
    };
  }

  const expected = normalizeOutput(JSON.stringify(testcase.expectedOutput));
  const actual = normalizeOutput(result.stdout || "");

  if (!outputsMatch(expected, actual, comparisonMode)) {
    return {
      index,
      isVisible,
      kind: "wrongAnswer",
      expectedOutput: testcase.expectedOutput,
      actualOutput: result.stdout || "",
    };
  }

  return { index, isVisible, kind: "passed" };
}

// ── submitHandler ─────────────────────────────────────────────────────────────
// Exported (not just registered inline) so it can be unit-tested directly
// with constructed req/res objects, without needing a running HTTP server
// or an extra test-only dependency like supertest.
//
// This is the ONLY code path that grades a submission AND the ONLY code
// path that writes a Submission document (via recordVerifiedSubmission) —
// see controllers/submissionController.js for why that consolidation
// matters. Every `finish()` call below persists the actual, just-computed
// grading result before responding; nothing here is client-supplied.
export async function submitHandler(req, res) {
  const { problemSlug, code, language, functionName, visibletestcases } = req.body;

  // ── Load hidden testcases ──────────────────────────────────────────────
  const problem = await Problem.findOne({
    slug: problemSlug,
  });

  if (!problem) {
    return res.status(404).json({
      error: `Problem "${problemSlug}" not found.`,
    });
  }

  const hidden = problem.hiddentestcases ?? [];

  if (hidden.length === 0) {
    return res.status(404).json({
      error: `No hidden testcases configured for "${problemSlug}".`,
    });
  }

  const languageId = languageIdMap[language];
  const alltestcases = [...visibletestcases, ...hidden];

  // Declared return type for this language, from the problem's own contract
  // (never from the client — submit-mode grading only trusts what's stored
  // server-side). Undefined for python/javascript or for problems that
  // haven't declared a contract yet; generateDriverCode falls back to its
  // regex inference in that case.
  const returnType = problem.returnType?.[language] || undefined;

  // Output comparison mode — see Problem.comparisonMode's doc comment and
  // audit finding P0-3. Server-side only, same trust model as returnType
  // above: a submission's grading must not depend on anything the client
  // sends beyond the code itself.
  const comparisonMode = problem.comparisonMode || "exact";

  // Operation-sequence contract opt-in — see Problem.operationSequence's
  // doc comment and audit finding P0-2. Server-side only, same trust
  // model as returnType/comparisonMode above.
  const operationSequence = problem.operationSequence?.enabled
    ? problem.operationSequence
    : undefined;

  // ── CRITICAL GUARD: empty testcases → would silently return Accepted ──
  if (alltestcases.length === 0) {
    req.log.error({ problemSlug }, "[Judge] No testcases found — CRITICAL: would silently return Accepted without this guard");
    return res.status(500).json({
      error: `Judge has no testcases to run for "${problemSlug}".`,
    });
  }

  req.log.debug(
    {
      problemSlug,
      language,
      visibleCount: visibletestcases.length,
      hiddenCount: hidden.length,
      totalCount: alltestcases.length,
    },
    "[Judge] Submission received"
  );

  const startTime = Date.now();
  let passedCount = 0;
  let visiblePassed = 0;
  let hiddenPassed = 0;

  // ── finish(): the single exit point for this handler ───────────────────
  // Persists the graded result (best-effort — a Mongo hiccup must not turn
  // a successful/valid grading run into a 500 for the user) and THEN
  // responds. Persistence is awaited before res.json() so that by the time
  // the client receives this response, the Submission row already exists —
  // the frontend's next call (PUT /api/progress, to update solved/XP state)
  // depends on being able to find it immediately (see routes/progress.js's
  // verifyAgainstSubmissions middleware).
  async function finish(status, payload, submissionExtra = {}) {
    // ── Submission Experience fields ──────────────────────────────────────
    // submissionId lets the frontend attach a Reflection Score to THIS
    // exact submission (see routes/reflections.js). encouragementMessage
    // is the (possibly deduped) copy computed inside recordVerifiedSubmission
    // for non-Accepted results — see utils/encouragementMessages.js.
    // Both are best-effort: a persistence hiccup below must not turn a
    // successfully-graded submission into a failed response for the user,
    // so they're simply omitted from the payload if the write failed.
    let responseExtras = {};

    if (req.userDoc) {
      try {
        const submissionDoc = await recordVerifiedSubmission({
          userId: req.userDoc._id,
          problemSlug,
          problemTitle: problem.title,
          language,
          code,
          status,
          passed: payload.passed ?? passedCount,
          total: payload.total ?? alltestcases.length,
          visiblePassed: submissionExtra.visiblePassed ?? visiblePassed,
          hiddenPassed: submissionExtra.hiddenPassed ?? hiddenPassed,
          executionTime: payload.executionTime ?? null,
          expectedOutput: submissionExtra.expectedOutput,
          actualOutput: submissionExtra.actualOutput,
        });

        responseExtras.submissionId = submissionDoc._id.toString();
        if (submissionDoc.encouragementMessage) {
          responseExtras.encouragementMessage = submissionDoc.encouragementMessage;
        }
      } catch (err) {
        req.log.error({ err, problemSlug, status }, "[Judge] Failed to persist submission record");
      }
    }

    return res.json({ status, ...payload, ...responseExtras });
  }

  try {
    // Run the first testcase alone. This preserves the original cost
    // profile for the most common failure modes (bad syntax, or a
    // solution that's wrong on the very first case) — a single Judge0
    // call, same as the old fully-sequential loop would have made,
    // instead of firing every testcase at once and paying for N compile
    // failures when the code doesn't even build.
    const first = await runTestcase({
      testcase: alltestcases[0],
      index: 0,
      isVisible: 0 < visibletestcases.length,
      code, language, languageId, functionName, returnType, comparisonMode, operationSequence,
    });

    let allResults;

    if (first.kind !== "passed" || alltestcases.length === 1) {
      allResults = [first];
    } else {
      // First testcase compiled and passed — the code builds. Run the
      // rest concurrently (throttled system-wide by the fixed
      // services/directExecutionQueue.js semaphore) since a compile
      // failure is no longer the dominant risk; only a per-input runtime
      // error or wrong answer can still occur independently on any one
      // of them.
      const rest = alltestcases.slice(1);
      const restResults = await Promise.all(
        rest.map((testcase, i) => {
          const index = i + 1;
          return runTestcase({
            testcase,
            index,
            isVisible: index < visibletestcases.length,
            code, language, languageId, functionName, returnType, comparisonMode, operationSequence,
          });
        })
      );
      allResults = [first, ...restResults];
    }

    // Walk results in canonical index order (not completion order) to
    // find the first failure — this matches the original "stop at first
    // failure" semantics exactly, even though every testcase actually ran
    // (see runTestcase's docstring for the callError/noResult/etc. kinds).
    let failure = null;

    for (const r of allResults) {
      if (r.kind === "passed") {
        passedCount++;
        if (r.isVisible) visiblePassed++;
        else hiddenPassed++;
      } else {
        failure = r;
        break;
      }
    }

    if (failure) {
      req.log.debug(
        {
          problemSlug,
          testcaseIndex: failure.index + 1,
          totalCount: alltestcases.length,
          kind: failure.kind,
        },
        "[Judge] Testcase result"
      );

      if (failure.kind === "callError") {
        req.log.error(
          { err: failure.error, problemSlug, testcaseIndex: failure.index },
          "[Judge] callJudge0 threw"
        );
        return finish("Judge Error", {
          passed: passedCount,
          total: alltestcases.length,
          error: failure.errorMessage,
        });
      }

      if (failure.kind === "noResult") {
        return finish("Judge Error", {
          passed: passedCount,
          total: alltestcases.length,
          error: failure.errorMessage,
        });
      }

      if (failure.kind === "compileError") {
        return finish("Compilation Error", {
          passed: passedCount,
          total: alltestcases.length,
          error: failure.errorMessage,
        });
      }

      if (failure.kind === "infraError" || failure.kind === "runtimeError") {
        return finish(failure.kind === "infraError" ? "Judge Error" : "Runtime Error", {
          passed: passedCount,
          total: alltestcases.length,
          error: failure.errorMessage,
        });
      }

      // failure.kind === "wrongAnswer"
      return finish(
        "Wrong Answer",
        {
          passed: passedCount,
          total: alltestcases.length,
          visiblePassed,
          hiddenPassed,
          executionTime: String(Date.now() - startTime),
          ...(failure.isVisible ? {
            expectedOutput: failure.expectedOutput,
            actualOutput: failure.actualOutput,
          } : {}),
        },
        {
          visiblePassed,
          hiddenPassed,
          // Submission history stores expected/actual regardless of
          // visibility (it's the user's own past attempt, not a live
          // hidden-testcase leak to other users) — only the *response*
          // withholds it for hidden failures, per failure.isVisible above.
          expectedOutput: failure.expectedOutput,
          actualOutput: failure.actualOutput,
        }
      );
    }

    req.log.info(
      { problemSlug, judge0Status: "Accepted", passedCount, totalCount: alltestcases.length },
      "[Judge] Submission accepted"
    );

    return finish(
      "Accepted",
      {
        passed: passedCount,
        total: alltestcases.length,
        visiblePassed,
        hiddenPassed,
        executionTime: String(Date.now() - startTime),
      },
      { visiblePassed, hiddenPassed }
    );

  } catch (err) {
    req.log.error({ err, problemSlug }, "[Judge] Unhandled error during grading");
    return finish("Judge Error", {
      passed: passedCount,
      total: alltestcases.length,
      error: "An unexpected error occurred during judging.",
    });
  }
}