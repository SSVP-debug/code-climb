import { apiFetch } from "./api";

export const judgeSubmission = async ({
  problem,
  code,
  language,
  onProgress,
  // Fest Readiness Audit, P0-1: passed straight through to the server,
  // which is the only place that decides whether it actually earns
  // contest credit (see backend/controllers/judgeController.js
  // submitHandler + backend/services/contestScoring.js). Sending this
  // does not, by itself, grant anything.
  contestId,
}) => {
  // Signal to UI that judging has started
  if (onProgress) {
    onProgress({ current: 0, total: 1 });
  }

  try {
    const result = await apiFetch("/api/judge/submit", {
      method: "POST",
      body: JSON.stringify({
        problemSlug: problem.slug,
        code,
        language,
        functionName: problem.functionName,
        // Visible testcases are NOT secret — safe to send from frontend.
        // Hidden testcases are loaded server-side by the backend.
        visibletestcases: problem.testcases || [],
        ...(contestId ? { contestId } : {}),
      }),
    });

    return result;

  } catch (error) {
    console.error("[judgeSubmission] Error:", error.message);

    // Return a Judge-shaped error so ProblemDetailsPage doesn't crash
    return {
      status: "Judge Error",
      error: error.message,
      passed: 0,
      total: 0,
    };
  }
};


export const runTestcases = async ({ problem, code, language }) => {
  try {
    const result = await apiFetch("/api/judge/run", {
      method: "POST",
      body: JSON.stringify({
        problemSlug: problem.slug,
        code,
        language,
        testcases: problem.testcases || [],
        // functionName/returnType/comparisonMode/operationSequence are
        // resolved SERVER-SIDE from the problem's own record via
        // problemSlug above (see backend/controllers/judgeController.js
        // runHandler) — the same trust model submitHandler already used,
        // now applied to Run too (audit finding P1-1). Not sent from here
        // anymore; sending them would have no effect server-side.
      }),
    });

    return result; // { results: [...], compileFailed: bool, error?: string }

  } catch (error) {
    console.error("[runTestcases] Error:", error);

    return {
      results: [],
      compileFailed: false,
      error: "Failed to execute test cases.",
    };
  }
};