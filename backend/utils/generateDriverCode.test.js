import { describe, expect, it } from "vitest";
import { generateDriverCode } from "./generateDriverCode.js";
import { validateProblems } from "../scripts/validateProblemContracts.js";

describe("generateDriverCode — Java return type", () => {
  it("declared int (unchanged behavior)", () => {
    const code = `class Solution {\n  public int solve(int[] nums) {\n    return 0;\n  }\n}`;
    const driver = generateDriverCode("java", code, { nums: [1, 2, 3] }, "solve", "int");

    expect(driver).toContain("int result = solution.solve(nums);");
  });

  it("declared long — the direct regression test for the Count Pairs bug", () => {
    const code = `class Solution {\n  public long countPairs(int[] nums, int target) {\n    return 0;\n  }\n}`;
    const driver = generateDriverCode(
      "java",
      code,
      { nums: [1, 1], target: 2 },
      "countPairs",
      "long"
    );

    expect(driver).toContain("long result = solution.countPairs(nums, target);");
    expect(driver).not.toContain("int result = solution.countPairs");
  });

  it("no declared type, long in source — the widened regex fallback also catches it", () => {
    const code = `class Solution {\n  public long countPairs(int[] nums, int target) {\n    return 0;\n  }\n}`;
    // No 5th argument — forces the regex-inference fallback path.
    const driver = generateDriverCode("java", code, { nums: [1, 1], target: 2 }, "countPairs");

    expect(driver).toContain("long result = solution.countPairs(nums, target);");
  });

  it("int[] special case still takes the Arrays.toString() branch", () => {
    const code = `class Solution {\n  public int[] solve(int[] nums) {\n    return nums;\n  }\n}`;
    const driver = generateDriverCode("java", code, { nums: [1, 2] }, "solve", "int[]");

    expect(driver).toContain("Arrays.toString(result)");
  });
});

describe("generateDriverCode — C++ return type", () => {
  it("declared int emits a normal solve() call through printResult", () => {
    const code = `class Solution {\npublic:\n  int solve(vector<int>& nums) {\n    return 0;\n  }\n};`;
    const driver = generateDriverCode("cpp", code, { nums: [1, 2, 3] }, "solve", "int");

    expect(driver).toContain("auto result = solution.solve(nums);");
    expect(driver).toContain("printResult(result);");
  });

  it("declared long long — auto + overloaded printResult already handles it without a cast", () => {
    const code = `class Solution {\npublic:\n  long long countPairs(vector<int>& nums, int target) {\n    return 0;\n  }\n};`;
    const driver = generateDriverCode(
      "cpp",
      code,
      { nums: [1, 1], target: 2 },
      "countPairs",
      "long long"
    );

    // The C++ branch dispatches through `auto` + overload resolution, not a
    // hardcoded declared-type cast — confirm no int-typed declaration was
    // introduced for this call.
    expect(driver).toContain("auto result = solution.countPairs(nums, target);");
    expect(driver).not.toContain("int result");
    expect(driver).toContain("void printResult(long long x)");
  });
});

describe("generateDriverCode — Python", () => {
  it("large integer results round-trip through json.dumps without truncation", () => {
    const code = `class Solution:\n    def countPairs(self, nums, target):\n        return 4999950000`;
    const driver = generateDriverCode("python", code, { nums: [1], target: 2 }, "countPairs");

    expect(driver).toContain("print(json.dumps(_result))");
    // Python ints are arbitrary precision — no special-casing needed, this
    // just locks in that the generated driver doesn't introduce any.
    expect(driver).not.toMatch(/int32|struct\.pack/);
  });
});

describe("generateDriverCode — JavaScript", () => {
  it("large numeric results within Number.MAX_SAFE_INTEGER round-trip via JSON.stringify", () => {
    const code = `function countPairs(nums, target) {\n  return 4999950000;\n}`;
    const driver = generateDriverCode("javascript", code, { nums: [1], target: 2 }, "countPairs");

    expect(driver).toContain("console.log(JSON.stringify(_result));");
    // 4,999,950,000 is well within Number.MAX_SAFE_INTEGER (2^53 - 1 =
    // 9,007,199,254,740,991), so no special serialization is needed for
    // this problem. A future problem whose result could exceed 2^53 would
    // need a documented string-serialization contract, which does not
    // exist today — that's a separate, currently out-of-scope concern.
    expect(4999950000).toBeLessThan(Number.MAX_SAFE_INTEGER);
  });
});

describe("generateDriverCode — Two Sum Count Pairs overflow regression", () => {
  it("Java driver for the maximum-n case declares a long, not an int", () => {
    const n = 100000;
    const code = `class Solution {\n  public long countPairs(int[] nums, int target) {\n    return 0;\n  }\n}`;
    const driver = generateDriverCode(
      "java",
      code,
      { nums: Array(n).fill(1), target: 2 },
      "countPairs",
      "long"
    );

    // 100000 * 99999 / 2 = 4,999,950,000 > Integer.MAX_VALUE (2,147,483,647).
    expect(n * (n - 1)) // sanity: the combinatorial count this problem exercises
      .toBeGreaterThan(2 * 2147483647);
    expect(driver).toContain("long result = solution.countPairs(nums, target);");
  });
});

describe("validateProblemContracts — mismatch detection", () => {
  it("flags a problem whose starter code disagrees with its declared returnType", () => {
    const mismatched = {
      slug: "fake-problem",
      functionName: "countPairs",
      returnType: { java: "long", cpp: "long long" },
      starterCode: {
        java: `class Solution {\n  public int countPairs(int[] nums, int target) {\n    return 0;\n  }\n}`,
        cpp: `class Solution {\npublic:\n  int countPairs(vector<int>& nums, int target) {\n    return 0;\n  }\n};`,
      },
    };

    const errors = validateProblems([mismatched]);

    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatch(/Java starter code declares return type "int"/);
    expect(errors[1]).toMatch(/C\+\+ starter code declares return type "int"/);
  });

  it("passes a consistent problem definition", () => {
    const consistent = {
      slug: "fake-problem-ok",
      functionName: "countPairs",
      returnType: { java: "long", cpp: "long long" },
      starterCode: {
        java: `class Solution {\n  public long countPairs(int[] nums, int target) {\n    return 0;\n  }\n}`,
        cpp: `class Solution {\npublic:\n  long long countPairs(vector<int>& nums, int target) {\n    return 0;\n  }\n};`,
      },
    };

    expect(validateProblems([consistent])).toHaveLength(0);
  });

  it("real problem data (src/data/problems.js) has no contract mismatches", async () => {
    const { default: problems } = await import("../../src/data/problems.js");
    expect(validateProblems(problems)).toHaveLength(0);
  });

  it("real Code Club Edition mission data has no contract mismatches", async () => {
    // Shares the same Problem schema and generateDriverCode runner as the
    // standard catalog (see backend/scripts/seedCodeClubEdition.js) — must
    // be checked too, not just src/data/problems.js.
    const { default: missions } = await import(
      "../../src/data/code-club-edition/index.js"
    );
    expect(validateProblems(missions)).toHaveLength(0);
  });
});