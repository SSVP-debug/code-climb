import { describe, expect, it, vi, beforeEach } from "vitest";
import { judgeSubmission } from "./judgeService";
import { runCode } from "./compiler";

vi.mock("./compiler", () => ({
  runCode: vi.fn(),
}));

describe("judgeSubmission", () => {
  const problem = {
    title: "Two Sum",
    slug: "two-sum",
    functionName: "twoSum",
    starterCode: { python: "def twoSum(nums, target): pass" },
    testcases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] },
      { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2] },
    ],
    hiddenTestcases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] },
      { input: { nums: [1, 5, 8, 2], target: 10 }, expectedOutput: [2, 3] },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("verify Two Sum accepted solution passes", async () => {
    runCode.mockImplementation(async (code) => {
      if (code.includes("[2,7,11,15]")) {
        return {
          stdout: "[0,1]\n",
          stderr: null,
          compile_output: null,
          status: { id: 3, description: "Accepted" },
        };
      } else if (code.includes("[3,2,4]")) {
        return {
          stdout: "[1,2]\n",
          stderr: null,
          compile_output: null,
          status: { id: 3, description: "Accepted" },
        };
      } else if (code.includes("[1,5,8,2]")) {
        return {
          stdout: "[2,3]\n",
          stderr: null,
          compile_output: null,
          status: { id: 3, description: "Accepted" },
        };
      }
      return {
        stdout: "null\n",
        stderr: null,
        compile_output: null,
        status: { id: 3, description: "Accepted" },
      };
    });

    const res = await judgeSubmission({
      problem,
      code: "class Solution:\n    def twoSum(self, nums, target):\n        pass",
      language: "python",
    });

    expect(res.status).toBe("Accepted 🎉");
    expect(res.passed).toBe(4);
  });

  it("verify wrong solution becomes Wrong Answer", async () => {
    runCode.mockImplementation(async () => {
      return {
        stdout: "null\n",
        stderr: null,
        compile_output: null,
        status: { id: 3, description: "Accepted" },
      };
    });

    const res = await judgeSubmission({
      problem,
      code: "class Solution:\n    def twoSum(self, nums, target):\n        pass",
      language: "python",
    });

    expect(res.status).toBe("Wrong Answer ❌");
    expect(res.passed).toBe(0);
  });

  it("verify syntax error becomes Compile Error", async () => {
    runCode.mockImplementation(async () => {
      return {
        stdout: null,
        stderr: '  File "script.py", line 3\n    \n                    ^\nSyntaxError: unexpected EOF while parsing\n',
        compile_output: null,
        status: { id: 11, description: "Runtime Error (NZEC)" },
      };
    });

    const res = await judgeSubmission({
      problem,
      code: "class Solution:\n    def twoSum(self, nums, target):\n        return [0, 1",
      language: "python",
    });

    expect(res.status).toBe("Compilation Error ❌");
  });

  it("verify actual runtime crash becomes Runtime Error", async () => {
    runCode.mockImplementation(async () => {
      return {
        stdout: null,
        stderr: '  File "script.py", line 3, in twoSum\nZeroDivisionError: division by zero\n',
        compile_output: null,
        status: { id: 11, description: "Runtime Error (NZEC)" },
      };
    });

    const res = await judgeSubmission({
      problem,
      code: "class Solution:\n    def twoSum(self, nums, target):\n        return 1/0",
      language: "python",
    });

    expect(res.status).toBe("Runtime Error ❌");
  });
});
