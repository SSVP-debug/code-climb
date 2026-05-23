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
  }) => {

    try {

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

        // Generate executable code
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

        // Wrong Answer
        if (
          expected !== actual
        ) {

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
          };
        }

        passedCount++;
        if (index < visibleTestcases.length) {

          visiblePassed++;

        } else {

          hiddenPassed++;

        }
      }

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
      };

    } catch (error) {

      return {
        status:
          "Judge Error ❌",

        error: error.message,
      };

    }
  };