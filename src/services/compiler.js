import { apiFetch } from "./api";

const JUDGE0_DIRECT_URL =
  import.meta.env.VITE_JUDGE0_API_URL ||
  "https://ce.judge0.com/submissions?base64_encoded=false&wait=true";

// Only fall back to Judge0 direct when the backend is genuinely unreachable
// (network down, server not running, gateway error).
// 401 is intentionally excluded — that's an auth problem, not an availability problem.

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

export async function runCode(
  sourceCode,
  languageId,
  stdin = ""
) {
  try {
    return await runViaBackend(
      sourceCode,
      languageId,
      stdin
    );
  } catch (error) {
    console.error(
      "[Compiler] Error:",
      error.message
    );

    return {
      stderr:
        error.message ||
        "Code runner unavailable",
    };
  }
}
