import { generateDriverCode } from "../utils/generateDriverCode.js";

const JUDGE0_LANGUAGE_NAMES = {
  54: "C++",
  62: "Java",
  63: "JavaScript",
  71: "Python",
};

const LANGUAGE_STRINGS = {
  71: "python",
  63: "javascript",
  62: "java",
  54: "cpp",
};

// ── Shared Judge0 fetch ───────────────────────────────────────────────────────
// Internal utility — not exported as a route handler.
async function fetchJudge0(sourceCode, languageId, stdin = "") {
  const judge0Url =
    process.env.JUDGE0_API_URL ||
    "https://ce.judge0.com/submissions?base64_encoded=false&wait=true";

  const response = await fetch(judge0Url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_code: sourceCode,
      language_id: languageId,
      stdin,
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.message || `Judge0 returned HTTP ${response.status}`);
  }

  return response.json();
}

// ── callJudge0 ────────────────────────────────────────────────────────────────
// Named export used by backend/routes/judge.js.
//
// Generates driver code for the given testcase then runs it through Judge0.
// Returns the raw Judge0 result: { stdout, stderr, compile_output, status, time, memory }
//
// Parameters:
//   sourceCode    — the user's solution code (without driver wrapper)
//   language      — language string: "python" | "javascript" | "java" | "cpp"
//   languageId    — Judge0 language ID: 71 | 63 | 62 | 54
//   testcaseInput — plain object matching function parameter names: { nums: [...], target: 9 }
//   functionName  — the function to call: "twoSum", "maxSubArray", etc.
export async function callJudge0({ sourceCode, language, languageId, testcaseInput, functionName }) {
  const lang = language || LANGUAGE_STRINGS[languageId] || "python";

  const driverCode = generateDriverCode(lang, sourceCode, testcaseInput, functionName);

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[callJudge0] language=${lang} (${languageId}), function=${functionName}, ` +
      `input=${JSON.stringify(testcaseInput).slice(0, 80)}`
    );
  }

  return fetchJudge0(driverCode, languageId, "");
}

// ── runCode (existing route handler — unchanged) ──────────────────────────────
export async function runCode(req, res) {
  const { source_code, language_id, stdin = "" } = req.body;

  if (!source_code || language_id === undefined) {
    return res.status(400).json({
      error: "source_code and language_id are required",
    });
  }

  const langName = JUDGE0_LANGUAGE_NAMES[language_id] || `id:${language_id}`;

  console.log(
    `[Compiler] Run request — language=${langName} (${language_id}), ` +
    `source_length=${source_code.length}, stdin_length=${stdin.length}`
  );

  try {
    const data = await fetchJudge0(source_code, language_id, stdin);

    const statusDesc = data.status?.description || "Unknown";
    console.log(
      `[Compiler] Judge0 status=${statusDesc}, ` +
      `stdout_len=${(data.stdout || "").length}, stderr_len=${(data.stderr || "").length}`
    );

    if (process.env.NODE_ENV !== "production") {
      console.log(`[Compiler] stdout preview:`, (data.stdout || "").slice(0, 120));
      if (data.stderr) {
        console.log(`[Compiler] stderr preview:`, data.stderr.slice(0, 200));
      }
    }

    res.json(data);
  } catch (error) {
    console.error("[Compiler] Judge0 proxy error:", error.message);
    res.status(502).json({
      stderr: error.message || "Failed to reach Judge0",
      status: { id: 13, description: "Internal Error" },
    });
  }
}
