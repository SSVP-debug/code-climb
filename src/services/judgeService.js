import { apiFetch } from "./api";

export const judgeSubmission = async ({
  problem,
  code,
  language,
  onProgress,
}) => {
  // Signal to UI that judging has started
  if (onProgress) {
    onProgress({ current: 0, total: 1 });
  }

  try {
    const result = await apiFetch("/api/judge/submit", {
      method: "POST",
      body: JSON.stringify({
        problemSlug:      problem.slug,
        code,
        language,
        functionName:     problem.functionName,
        // Visible testcases are NOT secret — safe to send from frontend.
        // Hidden testcases are loaded server-side by the backend.
        visibletestcases: problem.testcases || [],
      }),
    });

    return result;

  } catch (error) {
    console.error("[judgeSubmission] Error:", error.message);

    // Return a Judge-shaped error so ProblemDetailsPage doesn't crash
    return {
      status: "Judge Error ❌",
      error:  error.message,
      passed: 0,
      total:  0,
    };
  }
};


export const runtestcases = async ({ problem, code, language }) => {
  try {
    const result = await apiFetch("/api/judge/run", {
      method: "POST",
      body: JSON.stringify({
        code,
        language,
        functionName: problem.functionName,
        testcases:    problem.testcases || [],
      }),
    });

    return result; // { results: [...], compileFailed: bool, error?: string }

  } catch (error) {
    console.error("[runtestcases] Error:", error.message);
    return {
      results: [],
      compileFailed: false,
      error: error.message,
    };
  }
};