import { runCode } from "./compiler";

import { generateDriverCode } from "../utils/generateDriverCode";

const normalizeOutput = (output) => {

  return output
    .toString()
    .trim()
    .replace(/\s+/g, "");

};

const languageMap = {
  python: 71,
  javascript: 63,
  java: 62,
  cpp: 54,
};

export const judgeSubmission =
  async ({
    problem,
    code,
    language,
    onProgress,
  }) => {

    try {

      const startTime =
        performance.now();

      const visibleTestcases =
        problem.testcases;

      const hiddenTestcases =
        problem.hiddenTestcases;

      const allTestcases = [
        ...visibleTestcases,
        ...hiddenTestcases,
      ];

      let passedCount = 0;
      let visiblePassed = 0;
      let hiddenPassed = 0;
      for (
        const [index, testcase]
        of allTestcases.entries()
      ) {

        if (onProgress) {

          onProgress({
            current: index + 1,
            total: allTestcases.length,
          });

        }

        // Generate executable code
        const executableCode =
          generateDriverCode(
            language,
            code,
            testcase.input,
            problem.functionName
          );

        // Run testcase
        const result =
          await runCode(
            executableCode,
            languageMap[language],
            ""
          );

        // Runtime Error
        if (result.stderr) {

          return {
            status:
              "Runtime Error ❌",

            passed:
              passedCount,

            total:
              allTestcases.length,

            error:
              result.stderr,
          };
        }

        // Compilation Error
        if (
          result.compile_output
        ) {

          return {
            status:
              "Compilation Error ❌",

            passed:
              passedCount,

            total:
              allTestcases.length,

            error:
              result.compile_output,
          };
        }

        const expected =
          normalizeOutput(
            JSON.stringify(
              testcase.expectedOutput
            )
          );

        const actual =
          normalizeOutput(
            result.stdout || ""
          );

        if (actual.length > 5000) {

          return {
            status:
              "Output Limit Exceeded ❌",

            passed:
              passedCount,

            total:
              allTestcases.length,
          };
        }

        // Wrong Answer
        if (
          expected !== actual
        ) {

          const endTime =
            performance.now();

          const executionTime =
            (endTime - startTime)
              .toFixed(2);

          return {
            status:
              "Wrong Answer ❌",

            passed:
              passedCount,

            total:
              allTestcases.length,

            visiblePassed,

            hiddenPassed,

            failedTestcase: testcase,

            expectedOutput:
              testcase.expectedOutput,

            actualOutput:
              result.stdout || "",

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

      const endTime =
        performance.now();

      const executionTime =
        (endTime - startTime)
          .toFixed(2);

      // Accepted
      return {
        status:
          "Accepted 🎉",

        passed:
          passedCount,

        total:
          allTestcases.length,

        visiblePassed,

        hiddenPassed,
        executionTime,

      };

    } catch (error) {

      return {
        status:
          "Judge Error ❌",

        error: error.message,
      };

    }
  };