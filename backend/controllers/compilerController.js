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
//
// Always uses base64_encoded=true to avoid Judge0's UTF-8 conversion error.
// Root cause: if JUDGE0_API_URL in the environment omits the base64_encoded param,
// Judge0 defaults to base64_encoded=true on most hosted instances. Sending plain
// text in that case causes Judge0 to try to base64-decode it, producing invalid
// UTF-8 bytes and the error "some attributes cannot be converted to UTF-8".
//
// Fix: we base64-encode all input fields unconditionally and force
// base64_encoded=true in the URL regardless of what JUDGE0_API_URL contains.
// Response fields (stdout, stderr, compile_output, message) are decoded back to
// plain strings before returning, so all callers are unaffected.
function b64Encode(str) {
  return Buffer.from(str ?? "", "utf-8").toString("base64");
}

function b64Decode(str) {
  if (!str) return str; // preserve null/undefined
  return Buffer.from(str, "base64").toString("utf-8");
}

async function fetchJudge0(sourceCode, languageId, stdin = "") {
  // Build the URL from the env var (or default), then force base64_encoded=true.
  // This means the fix works even if JUDGE0_API_URL in Railway is missing the param.
  const rawUrl =
    process.env.JUDGE0_API_URL ||
    "https://ce.judge0.com/submissions?wait=true";

  const url = new URL(rawUrl);
  url.searchParams.set("base64_encoded", "true");
  // Ensure wait=true is present so we get a result synchronously, not a token.
  if (!url.searchParams.has("wait")) {
    url.searchParams.set("wait", "true");
  }
  const judge0Url = url.toString();

  const response = await fetch(judge0Url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_code: b64Encode(sourceCode),
      language_id: languageId,
      stdin:        b64Encode(stdin),
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    const raw = await response.text();

    console.error("JUDGE0 ERROR RESPONSE:");
    console.error(raw);

    throw new Error(
      `Judge0 returned HTTP ${response.status}: ${raw}`
    );
  }

  const data = await response.json();

  // Decode the base64-encoded output fields back to plain strings.
  return {
    ...data,
    stdout:         b64Decode(data.stdout),
    stderr:         b64Decode(data.stderr),
    compile_output: b64Decode(data.compile_output),
    message:        b64Decode(data.message),
  };
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

  

  try {
    const data = await fetchJudge0(source_code, language_id, stdin);

    const statusDesc = data.status?.description || "Unknown";
    

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