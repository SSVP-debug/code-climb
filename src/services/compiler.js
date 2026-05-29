import { apiFetch } from "./api";

const JUDGE0_DIRECT_URL =
  import.meta.env.VITE_JUDGE0_API_URL ||
  "https://ce.judge0.com/submissions?base64_encoded=false&wait=true";

function isBackendUnavailableError(message) {
  return /failed|fetch|network|ECONNREFUSED|502|401|unauthorized|not found/i.test(
    message || ""
  );
}

async function runViaBackend(
  sourceCode,
  languageId,
  stdin
) {
  const token = await auth.currentUser.getIdToken();

  return await fetch("/api/compiler", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

async function runViaJudge0Direct(
  sourceCode,
  languageId,
  stdin
) {
  const response = await fetch(JUDGE0_DIRECT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
      data?.message ||
      `Judge0 request failed (${response.status})`
    );
  }

  return data;
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
    const message = error.message || "Failed to run code";

    if (isBackendUnavailableError(message)) {
      console.warn(
        "[Compiler] Backend unavailable, trying Judge0 direct fallback"
      );

      try {
        return await runViaJudge0Direct(
          sourceCode,
          languageId,
          stdin
        );
      } catch (fallbackError) {
        console.error(
          "[Compiler] Direct Judge0 fallback failed:",
          fallbackError
        );
        return {
          stderr:
            "Code runner unavailable. Start the backend server and ensure MongoDB is connected.",
        };
      }
    }

    console.error("[Compiler] Error:", message);
    return { stderr: message };
  }
}
