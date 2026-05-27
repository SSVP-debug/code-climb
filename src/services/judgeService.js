import { runCode } from "./compiler";
import { generateDriverCode } from "../utils/generateDriverCode";

const normalizeOutput = (output) =>
  output
    .toString()
    .trim()
    .replace(/\s+/g, "");

const languageMap = {
  python: 71,
  javascript: 63,
  java: 62,
  cpp: 54,
};

const RUNTIME_STATUS_IDS = new Set([
  7, 8, 9, 10, 11, 12,
]);

function isInfrastructureError(stderr) {
  return /code runner unavailable|failed to reach|ECONNREFUSED|502|network|unauthorized|fetch failed/i.test(
    stderr || ""
  );
}

function analyzeRunResult(result) {
  if (!result) {
    return { type: "infra", message: "No response from code runner" };
  }

  if (result.compile_output) {
    return {
      type: "compile",
      message: result.compile_output,
    };
  }

  const statusId = result.status?.id;

  if (statusId === 6) {
    return {
      type: "compile",
      message:
        result.compile_output ||
        result.status?.description ||
        "Compilation Error",
    };
  }

  if (result.stderr) {
    if (isInfrastructureError(result.stderr)) {
      return { type: "infra", message: result.stderr };
    }

    return { type: "runtime", message: result.stderr };
  }

  if (
    statusId &&
    RUNTIME_STATUS_IDS.has(statusId)
  ) {
    return {
      type: "runtime",
      message:
        result.status?.description ||
        "Runtime Error",
    };
  }

  return { type: "ok" };
}

export const judgeSubmission = async ({
  problem,
  code,
  language,
  onProgress,
}) => {
  try {
    const startTime = performance.now();
    const visibleTestcases = problem.testcases || [];
    const hiddenTestcases = problem.hiddenTestcases || [];
    const allTestcases = [
      ...visibleTestcases,
      ...hiddenTestcases,
    ];

    let passedCount = 0;
    let visiblePassed = 0;
    let hiddenPassed = 0;

    for (const [index, testcase] of allTestcases.entries()) {
      if (onProgress) {
        onProgress({
          current: index + 1,
          total: allTestcases.length,
        });
      }

      const executableCode = generateDriverCode(
        language,
        code,
        testcase.input,
        problem.functionName
      );

      if (import.meta.env.DEV) {
        console.log(
          `[Judge] testcase ${index + 1}/${allTestcases.length}, lang=${language}, id=${languageMap[language]}`
        );
        console.log(
          `[Judge] generated code (first 300 chars):`,
          executableCode.slice(0, 300)
        );
      }

      const result = await runCode(
        executableCode,
        languageMap[language],
        ""
      );

      const analysis = analyzeRunResult(result);

      if (analysis.type === "infra") {
        return {
          status: "Judge Error ❌",
          passed: passedCount,
          total: allTestcases.length,
          error: analysis.message,
        };
      }

      if (analysis.type === "compile") {
        return {
          status: "Compilation Error ❌",
          passed: passedCount,
          total: allTestcases.length,
          error: analysis.message,
        };
      }

      if (analysis.type === "runtime") {
        return {
          status: "Runtime Error ❌",
          passed: passedCount,
          total: allTestcases.length,
          error: analysis.message,
        };
      }

      const expected = normalizeOutput(
        JSON.stringify(testcase.expectedOutput)
      );

      const actual = normalizeOutput(
        result.stdout || ""
      );

      if (actual.length > 5000) {
        return {
          status: "Output Limit Exceeded ❌",
          passed: passedCount,
          total: allTestcases.length,
        };
      }

      if (expected !== actual) {
        const executionTime = (
          performance.now() - startTime
        ).toFixed(2);

        return {
          status: "Wrong Answer ❌",
          passed: passedCount,
          total: allTestcases.length,
          visiblePassed,
          hiddenPassed,
          failedTestcase: testcase,
          expectedOutput: testcase.expectedOutput,
          actualOutput: result.stdout || "",
          executionTime,
        };
      }

      passedCount++;

      if (index < visibleTestcases.length) {
        visiblePassed++;
      } else {
        hiddenPassed++;
      }
    }

    const executionTime = (
      performance.now() - startTime
    ).toFixed(2);

    return {
      status: "Accepted 🎉",
      passed: passedCount,
      total: allTestcases.length,
      visiblePassed,
      hiddenPassed,
      executionTime,
    };
  } catch (error) {
    return {
      status: "Judge Error ❌",
      error: error.message,
    };
  }
};
