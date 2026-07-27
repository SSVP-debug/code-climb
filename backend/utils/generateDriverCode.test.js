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

describe("generateDriverCode — Java argument types (audit P0-1)", () => {
  it("a String argument declares as String, not Object — the valid-parentheses reproduction", () => {
    const code = `class Solution {\n    public boolean isValid(String s) {\n        return true;\n    }\n}`;
    const driver = generateDriverCode("java", code, { s: "()[]{}" }, "isValid", "boolean");

    expect(driver).toContain('String s = "()[]{}";');
    expect(driver).not.toContain("Object s");
  });

  it("a String[] argument declares as String[] with a valid brace literal — the group-anagrams reproduction", () => {
    const code = `class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        return null;\n    }\n}`;
    const driver = generateDriverCode("java", code, { strs: ["eat", "tea", "tan"] }, "groupAnagrams", "List<List<String>>");

    expect(driver).toContain('String[] strs = {"eat", "tea", "tan"};');
    expect(driver).not.toContain("int[] strs");
    expect(driver).not.toMatch(/strs\s*=\s*\[/); // no invalid bracket literal
  });

  it("a numeric matrix argument declares as int[][] with nested braces — the course-schedule/clone-graph reproduction", () => {
    const code = `class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        return true;\n    }\n}`;
    const driver = generateDriverCode(
      "java", code, { numCourses: 2, prerequisites: [[1, 0]] }, "canFinish", "boolean"
    );

    expect(driver).toContain("int[][] prerequisites = {{1, 0}};");
    expect(driver).not.toMatch(/prerequisites\s*=\s*\[/);
  });

  it("real confirmed-broken problems from src/data/problems.js now generate clean Java for every declared/first testcase", async () => {
    const { default: problems } = await import("../../src/data/problems.js");
    const targets = [
      "valid-parentheses", "group-anagrams", "course-schedule",
      "clone-graph", "pacific-atlantic-water-flow", "word-break",
      "longest-common-prefix", "encode-and-decode-strings",
    ];

    for (const slug of targets) {
      const problem = problems.find((p) => p.slug === slug);
      expect(problem, `expected to find problem "${slug}" in src/data/problems.js`).toBeTruthy();

      const testcase = problem.testcases?.[0] || problem.hiddentestcases?.[0];
      const driver = generateDriverCode(
        "java",
        problem.starterCode.java,
        testcase.input,
        problem.functionName,
        problem.returnType?.java,
        problem.paramTypes?.java
      );

      expect(driver, `${slug}: should not declare any argument as Object`).not.toMatch(/\bObject\s+\w+\s*=/);
      expect(driver, `${slug}: should not use an invalid [ bracket array literal`).not.toMatch(/\]\s*\w+\s*=\s*\[/);
    }
  });
});

describe("generateDriverCode — paramTypes contract overrides structural inference", () => {
  it("an explicit paramTypes.java entry wins over the structural guess", () => {
    const code = `class Solution {\n    public long solve(long n) {\n        return n;\n    }\n}`;
    // A bare JS number like 5000000000 IS structurally distinguishable
    // from an int (Number.isInteger is still true for it, so the
    // structural fallback alone would call it "int" and silently
    // truncate/fail to compile as a long literal) — this is exactly the
    // case an explicit paramTypes declaration exists to cover.
    const driver = generateDriverCode(
      "java", code, { n: 5000000000 }, "solve", "long", { n: "long" }
    );

    expect(driver).toContain("long n = 5000000000L;");
  });
});

describe("generateDriverCode — Python boolean arguments (audit P1-3)", () => {
  it("formats a boolean argument as True/False, not the invalid lowercase true/false", () => {
    const code = `class Solution:\n    def hasCycle(self, flag):\n        return flag`;
    const driver = generateDriverCode("python", code, { flag: true }, "hasCycle");

    expect(driver).toContain("hasCycle(True)");
    expect(driver).not.toContain("hasCycle(true)");
  });

  it("formats a nested boolean (inside an array) correctly too", () => {
    const code = `class Solution:\n    def solve(self, flags):\n        return flags`;
    const driver = generateDriverCode("python", code, { flags: [true, false] }, "solve");

    expect(driver).toContain("solve([True, False])");
  });
});

describe("validateProblemContracts — argument generation check (audit P0-1)", () => {
  it("every real problem (except tracked design-pattern problems) generates argument-safe Java and C++", async () => {
    const { default: problems } = await import("../../src/data/problems.js");
    const errors = validateProblems(problems);
    expect(errors).toHaveLength(0);
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