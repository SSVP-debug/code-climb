import { apiFetch } from "./api";

// NOTE: a direct-to-Judge0 fallback (bypassing the backend when it's
// genuinely unreachable) was clearly planned here — see the comment
// below — but was never actually implemented; runCode's catch block
// just returns a generic error either way. Left as a flagged gap rather
// than silently building it: a direct fallback means the client would
// call ce.judge0.com directly with the student's source code, bypassing
// this app's own auth + rate limiting, which is a deliberate call to
// make, not a lint fix.

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
