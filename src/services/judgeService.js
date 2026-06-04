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
        visibleTestcases: problem.testcases || [],
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
