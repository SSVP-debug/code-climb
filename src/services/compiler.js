import { apiFetch } from "./api";

const JUDGE0_DIRECT_URL =
  import.meta.env.VITE_JUDGE0_API_URL ||
  "https://ce.judge0.com/submissions?base64_encoded=false&wait=true";

// Only fall back to Judge0 direct when the backend is genuinely unreachable
// (network down, server not running, gateway error).
// 401 is intentionally excluded — that's an auth problem, not an availability problem.
function isBackendUnavailableError(message) {
  return /failed to fetch|network error|ECONNREFUSED|502|503|504|not found/i.test(
    message || ""
  );
}

// Primary path: your Express backend, which enforces auth + rate limiting.
// apiFetch handles the Firebase token automatically.
async function runViaBackend(sourceCode, languageId, stdin) {
  return await apiFetch("/api/compiler/run", {
    method: "POST",
    body: JSON.stringify({
      source_code: sourceCode,
      language_id: languageId,
      stdin,
    }),
  });
}

// Fallback path: only used when the backend is completely unreachable.
// Useful during local development when the backend isn't running.
async function runViaJudge0Direct(sourceCode, languageId, stdin) {
  const response = await fetch(JUDGE0_DIRECT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_code: sourceCode,
      language_id: languageId,
      stdin,
    }),
    signal: AbortSignal.timeout(20000),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || `Judge0 direct request failed (${response.status})`
    );
  }

  return data;
}

// Public API — used by useRunCode hook.
// Returns a Judge0-shaped result object. Never throws — errors are returned
// as { stderr: "message" } so callers don't need try/catch.
export async function runCode(sourceCode, languageId, stdin = "") {
  try {
    return await runViaBackend(sourceCode, languageId, stdin);
  } catch (error) {
    const message = error.message || "Failed to run code";

    if (isBackendUnavailableError(message)) {
      console.warn(
        "[Compiler] Backend unreachable — falling back to Judge0 direct"
      );

      try {
        return await runViaJudge0Direct(sourceCode, languageId, stdin);
      } catch (fallbackError) {
        console.error(
          "[Compiler] Judge0 direct also failed:",
          fallbackError.message
        );
        return {
          stderr:
            "Code runner is unavailable. " +
            "Please start the backend server and try again.",
        };
      }
    }

    // Auth errors, validation errors, server errors — surface them directly.
    console.error("[Compiler] Error:", message);
    return { stderr: message };
  }
}
