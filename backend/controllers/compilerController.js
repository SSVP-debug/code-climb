import { generateDriverCode } from "../utils/generateDriverCode.js";
import { logger } from "../config/logger.js";
import {
  enqueueExecution,
} from "../services/executionQueue.js";

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

let judge0Failures = 0;
let circuitOpenedAt = 0;
let judge0RequestCount = 0;
let judge0SuccessCount = 0;
let judge0FailureCount = 0;

const FAILURE_THRESHOLD = 5;
const CIRCUIT_TIMEOUT_MS = 60_000;

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
  return enqueueExecution(async () => {
    if (isCircuitOpen()) {
      throw new Error(
        "Code execution service is temporarily unavailable. Please try again in a minute."
      );
    }
    // Build the URL from the env var (or default), then force base64_encoded=true.
    // This means the fix works even if JUDGE0_API_URL in Railway is missing the param.
    const startedAt = Date.now();
    judge0RequestCount++;
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

    const requestBody = JSON.stringify({
      source_code: b64Encode(sourceCode),
      language_id: languageId,
      stdin: b64Encode(stdin),

      cpu_time_limit:
        EXECUTION_LIMITS.cpuTimeLimit,

      wall_time_limit:
        EXECUTION_LIMITS.wallTimeLimit,

      memory_limit:
        EXECUTION_LIMITS.memoryLimitKb,

      max_processes_and_or_threads:
        EXECUTION_LIMITS.maxProcessesAndOrThreads,

      max_file_size:
        EXECUTION_LIMITS.maxFileSizeKb,
    });

    // ── Retry only genuinely transient failures ─────────────────────────────
    // Network errors and 5xx responses are infra hiccups worth a couple of
    // bounded retries (a dedicated/self-hosted Judge0 instance can drop a
    // request under load same as any service). A 4xx is our fault (bad
    // request shape) and retrying it will just fail the same way three times
    // instead of one — so those are NOT retried, they throw immediately.
    const MAX_ATTEMPTS = 3;
    const BASE_DELAY_MS = 300;

    let lastError;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const headers = {
          "Content-Type": "application/json",
        };

        if (process.env.JUDGE0_RAPIDAPI_KEY) {
          headers["X-RapidAPI-Key"] =
            process.env.JUDGE0_RAPIDAPI_KEY;
          headers["X-RapidAPI-Host"] =
            "judge0-ce.p.rapidapi.com";
        }

        if (process.env.JUDGE0_API_KEY) {
          headers["Authorization"] =
            process.env.JUDGE0_API_KEY;
        }

        const response = await fetch(judge0Url, {
          method: "POST",
          headers,
          body: requestBody,
          signal: AbortSignal.timeout(20000),
        });

        if (!response.ok) {
          const raw = await response.text();

          // 5xx = Judge0 itself is having trouble → retry.
          // 4xx = our request is malformed → no point retrying.
          if (response.status >= 500 && attempt < MAX_ATTEMPTS) {
            logger.warn(
              { httpStatus: response.status, attempt, maxAttempts: MAX_ATTEMPTS },
              "[Judge0] Transient HTTP error — retrying"
            );
            await sleep(BASE_DELAY_MS * attempt);
            continue;
          }
          judge0Failures++;

          judge0FailureCount++;

          logger.error(
            {
              durationMs: Date.now() - startedAt,
              httpStatus: response.status,
              totalRequests: judge0RequestCount,
              successes: judge0SuccessCount,
              failures: judge0FailureCount,
            },
            "[Judge0] HTTP failure"
          );

          if (
            judge0Failures === FAILURE_THRESHOLD
          ) {
            circuitOpenedAt = Date.now();

            logger.error(
              {
                failures: judge0Failures,
              },
              "[Judge0] Circuit opened"
            );
          }

          logger.error({ httpStatus: response.status, raw }, "[Judge0] Error response (final attempt, not retrying)");
          throw new Error(`Judge0 returned HTTP ${response.status}: ${raw}`);
        }

        const data = await response.json();
        judge0Failures = 0;
        circuitOpenedAt = 0;

        judge0SuccessCount++;

        logger.info(
          {
            durationMs: Date.now() - startedAt,
            status: data.status?.description,
            totalRequests: judge0RequestCount,
            successes: judge0SuccessCount,
            failures: judge0FailureCount,
          },
          "[Judge0] Request succeeded"
        );

        // Decode the base64-encoded output fields back to plain strings.
        return {
          ...data,
          stdout: b64Decode(data.stdout),
          stderr: b64Decode(data.stderr),
          compile_output: b64Decode(data.compile_output),
          message: b64Decode(data.message),
        };
      } catch (err) {
        lastError = err;

        // Network-level failure (connection refused, DNS, timeout abort) —
        // also transient, also worth retrying within the attempt budget.
        const isNetworkError =
          err.name === "TimeoutError" ||
          err.name === "AbortError" ||
          err.code === "ECONNREFUSED" ||
          err.cause?.code === "ECONNREFUSED";

        if (isNetworkError && attempt < MAX_ATTEMPTS) {
          logger.warn(
            { err, attempt, maxAttempts: MAX_ATTEMPTS },
            "[Judge0] Network error — retrying"
          );
          await sleep(BASE_DELAY_MS * attempt);
          continue;
        }

        judge0Failures++;

        judge0FailureCount++;

        logger.error(
          {
            durationMs: Date.now() - startedAt,
            totalRequests: judge0RequestCount,
            successes: judge0SuccessCount,
            failures: judge0FailureCount,
            err,
          },
          "[Judge0] Request failed"
        );

        if (
          judge0Failures === FAILURE_THRESHOLD
        ) {
          circuitOpenedAt = Date.now();

          logger.error(
            {
              failures: judge0Failures,
            },
            "[Judge0] Circuit opened"
          );
        }

        throw err;
      }
    }

    throw lastError;
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isCircuitOpen() {
  if (judge0Failures < FAILURE_THRESHOLD) {
    return false;
  }

  const elapsed = Date.now() - circuitOpenedAt;

  if (elapsed >= CIRCUIT_TIMEOUT_MS) {
    judge0Failures = 0;
    circuitOpenedAt = 0;
    return false;
  }

  return true;
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

  logger.debug(
    { language: lang, languageId, functionName, inputPreview: JSON.stringify(testcaseInput).slice(0, 80) },
    "[callJudge0] Dispatching to Judge0"
  );

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


    req.log.debug(
      {
        judge0Status: statusDesc,
        stdoutPreview: (data.stdout || "").slice(0, 120),
        stderrPreview: data.stderr ? data.stderr.slice(0, 200) : undefined,
      },
      "[Compiler] Judge0 result"
    );

    res.json(data);
  } catch (error) {
    req.log.error({ err: error }, "[Compiler] Judge0 proxy error");
    res.status(502).json({
      stderr: error.message || "Failed to reach Judge0",
      status: { id: 13, description: "Internal Error" },
    });
  }
}