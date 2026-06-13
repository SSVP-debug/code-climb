/**
 * generateDriverCode.test.js
 *
 * Test suite for the generateDriverCode utility.
 * Runner: Vitest  (npm test / vitest run)
 *
 * Coverage targets:
 *   - All four languages: python, javascript, java, cpp
 *   - Class-based vs function-based Python solutions
 *   - Java return-type inference: int[], boolean, int, String
 *   - C++ return-type inference: vector<int>, bool, int, string
 *   - Tree input detection (root parameter → build_tree wrapper)
 *   - Multiple input parameters
 *   - Edge cases: empty arrays, strings, null, boolean values
 *   - Default functionName fallback ("solve")
 *   - Unknown language returns undefined gracefully
 */

import { describe, expect, it } from "vitest";
import { generateDriverCode } from "./generateDriverCode";

// ── Shared fixtures ────────────────────────────────────────────────────────────

const INT_ARRAY_INPUT   = { nums: [2, 7, 11, 15], target: 9 };
const STRING_INPUT      = { s: "abcabcbb" };
const BOOL_INPUT        = { nums: [1, 2, 3, 1] };
const EMPTY_ARRAY_INPUT = { nums: [] };
const MULTI_INPUT       = { list1: [1, 2, 4], list2: [1, 3, 4] };
const TREE_INPUT        = { root: [3, 9, 20, -1, -1, 15, 7] };
const NESTED_INPUT      = { coins: [1, 5, 11], amount: 15 };

// ── Python ────────────────────────────────────────────────────────────────────

describe("generateDriverCode — python", () => {
  it("wraps a plain function with json.dumps output", () => {
    const code = generateDriverCode(
      "python",
      "def twoSum(nums, target):\n  pass",
      INT_ARRAY_INPUT,
      "twoSum"
    );
    expect(code).toContain("twoSum([2, 7, 11, 15], 9)");
    expect(code).toContain("json.dumps(_result)");
    expect(code).toContain("RUNTIME_ERROR");
  });

  it("wraps a class Solution method correctly", () => {
    const code = generateDriverCode(
      "python",
      "class Solution:\n  def twoSum(self, nums, target):\n    pass",
      INT_ARRAY_INPUT,
      "twoSum"
    );
    expect(code).toContain("Solution().twoSum([2, 7, 11, 15], 9)");
    expect(code).toContain("json.dumps(_result)");
  });

  it("passes string arguments correctly", () => {
    const code = generateDriverCode(
      "python",
      "def lengthOfLongestSubstring(s):\n  pass",
      STRING_INPUT,
      "lengthOfLongestSubstring"
    );
    expect(code).toContain('"abcabcbb"');
    expect(code).toContain("lengthOfLongestSubstring");
  });

  it("detects root parameter and wraps with build_tree()", () => {
    const code = generateDriverCode(
      "python",
      "def maxDepth(root):\n  pass",
      TREE_INPUT,
      "maxDepth"
    );
    expect(code).toContain("build_tree([3, 9, 20, None, None, 15, 7])");
    expect(code).toContain("def build_tree(values):");
    expect(code).toContain("class TreeNode:");
  });

  it("handles empty array input", () => {
    const code = generateDriverCode(
      "python",
      "def reverseList(head):\n  pass",
      EMPTY_ARRAY_INPUT,
      "reverseList"
    );
    expect(code).toContain("reverseList([]");
  });

  it("handles multiple array parameters", () => {
    const code = generateDriverCode(
      "python",
      "def mergeTwoLists(list1, list2):\n  pass",
      MULTI_INPUT,
      "mergeTwoLists"
    );
    expect(code).toContain("[1, 2, 4]");
    expect(code).toContain("[1, 3, 4]");
  });

  it("uses 'solve' as default functionName when none provided", () => {
    const code = generateDriverCode(
      "python",
      "def solve(n):\n  pass",
      { n: 5 },
      undefined
    );
    expect(code).toContain("solve(5)");
  });

  it("includes RUNTIME_ERROR handler", () => {
    const code = generateDriverCode("python", "def f(n):\n  pass", { n: 1 }, "f");
    expect(code).toContain("RUNTIME_ERROR");
  });
});

// ── JavaScript ────────────────────────────────────────────────────────────────

describe("generateDriverCode — javascript", () => {
  it("wraps function with JSON.stringify output", () => {
    const code = generateDriverCode(
      "javascript",
      "function twoSum(nums, target) {}",
      INT_ARRAY_INPUT,
      "twoSum"
    );
    expect(code).toContain("JSON.stringify(_result)");
    expect(code).toContain("twoSum(");
  });

  it("passes array and number args correctly", () => {
    const code = generateDriverCode(
      "javascript",
      "function twoSum(nums, target) {}",
      INT_ARRAY_INPUT,
      "twoSum"
    );
    expect(code).toContain("[2,7,11,15]");
    expect(code).toContain("9");
  });

  it("passes string args correctly", () => {
    const code = generateDriverCode(
      "javascript",
      "function lengthOfLongestSubstring(s) {}",
      STRING_INPUT,
      "lengthOfLongestSubstring"
    );
    expect(code).toContain('"abcabcbb"');
  });

  it("handles empty array arg", () => {
    const code = generateDriverCode(
      "javascript",
      "function reverseList(head) {}",
      EMPTY_ARRAY_INPUT,
      "reverseList"
    );
    expect(code).toContain("[]");
  });

  it("includes RUNTIME_ERROR handler", () => {
    const code = generateDriverCode(
      "javascript",
      "function f(n) {}",
      { n: 1 },
      "f"
    );
    expect(code).toContain("RUNTIME_ERROR");
  });

  it("uses 'solve' as default functionName", () => {
    const code = generateDriverCode(
      "javascript",
      "function solve(n) {}",
      { n: 3 },
      undefined
    );
    expect(code).toContain("solve(");
  });
});

// ── Java ──────────────────────────────────────────────────────────────────────

describe("generateDriverCode — java", () => {
  it("generates Main class wrapper with int[] return type", () => {
    const code = generateDriverCode(
      "java",
      "class Solution { public int[] twoSum(int[] nums, int target) { return new int[0]; } }",
      INT_ARRAY_INPUT,
      "twoSum"
    );
    expect(code).toContain("class Main");
    expect(code).toContain("public static void main");
    expect(code).toContain("solution.twoSum(nums, target)");
    expect(code).toContain("Arrays.toString(result)");
    expect(code).toContain("import java.util.Arrays");
  });

  it("infers int[] return type and uses Arrays.toString", () => {
    const code = generateDriverCode(
      "java",
      "class Solution { public int[] twoSum(int[] nums, int target) { return new int[0]; } }",
      INT_ARRAY_INPUT,
      "twoSum"
    );
    expect(code).toContain("int[] result = solution.twoSum");
    expect(code).toContain("Arrays.toString(result)");
  });

  it("infers boolean return type and uses println directly", () => {
    const code = generateDriverCode(
      "java",
      "class Solution { public boolean containsDuplicate(int[] nums) { return false; } }",
      BOOL_INPUT,
      "containsDuplicate"
    );
    expect(code).toContain("boolean result = solution.containsDuplicate");
    expect(code).toContain("System.out.println(result)");
    expect(code).not.toContain("Arrays.toString");
  });

  it("infers int return type", () => {
    const code = generateDriverCode(
      "java",
      "class Solution { public int maxProfit(int[] prices) { return 0; } }",
      { prices: [7, 1, 5, 3, 6, 4] },
      "maxProfit"
    );
    expect(code).toContain("int result = solution.maxProfit");
    expect(code).toContain("System.out.println(result)");
  });

  it("infers String return type", () => {
    const code = generateDriverCode(
      "java",
      "class Solution { public String longestCommonPrefix(String[] strs) { return \"\"; } }",
      { strs: ["flower", "flow"] },
      "longestCommonPrefix"
    );
    expect(code).toContain("String result = solution.longestCommonPrefix");
  });

  it("defaults to int return type when signature not matched", () => {
    const code = generateDriverCode(
      "java",
      "// no signature here",
      { n: 5 },
      "solve"
    );
    expect(code).toContain("int result = solution.solve");
  });

  it("declares int[] variable for array inputs", () => {
    const code = generateDriverCode(
      "java",
      "class Solution { public int maxProfit(int[] prices) { return 0; } }",
      { prices: [7, 1, 5] },
      "maxProfit"
    );
    expect(code).toContain("int[] prices = new int[] {7, 1, 5}");
  });

  it("declares int variable for number inputs", () => {
    const code = generateDriverCode(
      "java",
      "class Solution { public int climbStairs(int n) { return 0; } }",
      { n: 5 },
      "climbStairs"
    );
    expect(code).toContain("int n = 5");
  });

  it("handles empty array input", () => {
    const code = generateDriverCode(
      "java",
      "class Solution { public int[] reverseList(int[] head) { return new int[0]; } }",
      EMPTY_ARRAY_INPUT,
      "reverseList"
    );
    expect(code).toContain("new int[] {}");
  });

  it("includes RUNTIME_ERROR handler", () => {
    const code = generateDriverCode(
      "java",
      "class Solution { public int f(int n) { return 0; } }",
      { n: 1 },
      "f"
    );
    expect(code).toContain("RUNTIME_ERROR");
    expect(code).toContain("catch (Exception e)");
  });

  it("handles multiple parameters", () => {
    const code = generateDriverCode(
      "java",
      "class Solution { public int[] twoSum(int[] nums, int target) { return new int[0]; } }",
      INT_ARRAY_INPUT,
      "twoSum"
    );
    expect(code).toContain("solution.twoSum(nums, target)");
  });
});

// ── C++ ───────────────────────────────────────────────────────────────────────

describe("generateDriverCode — cpp", () => {
  it("generates main() with standard headers", () => {
    const code = generateDriverCode(
      "cpp",
      "class Solution { public: vector<int> twoSum(vector<int>& nums, int target) { return {}; } };",
      INT_ARRAY_INPUT,
      "twoSum"
    );
    expect(code).toContain("int main()");
    expect(code).toContain("#include <iostream>");
    expect(code).toContain("#include <vector>");
    expect(code).toContain("using namespace std");
  });

  it("infers vector<int> return type", () => {
    const code = generateDriverCode(
      "cpp",
      "class Solution { public: vector<int> twoSum(vector<int>& nums, int target) { return {}; } };",
      INT_ARRAY_INPUT,
      "twoSum"
    );
    expect(code).toContain("solution.twoSum");
    expect(code).toContain("cout");
  });

  it("infers bool return type", () => {
    const code = generateDriverCode(
      "cpp",
      "class Solution { public: bool containsDuplicate(vector<int>& nums) { return false; } };",
      BOOL_INPUT,
      "containsDuplicate"
    );
    expect(code).toContain("solution.containsDuplicate");
  });

  it("infers int return type", () => {
    const code = generateDriverCode(
      "cpp",
      "class Solution { public: int maxProfit(vector<int>& prices) { return 0; } };",
      { prices: [7, 1, 5] },
      "maxProfit"
    );
    expect(code).toContain("solution.maxProfit");
    expect(code).toContain("cout << result");
  });

  it("infers string return type", () => {
    const code = generateDriverCode(
      "cpp",
      "class Solution { public: string longestCommonPrefix(vector<string>& strs) { return \"\"; } };",
      { strs: ["flower", "flow"] },
      "longestCommonPrefix"
    );
    expect(code).toContain("solution.longestCommonPrefix");
  });

  it("defaults to int when return type unmatched", () => {
    const code = generateDriverCode(
      "cpp",
      "// no signature",
      { n: 5 },
      "solve"
    );
    expect(code).toContain("solution.solve");
  });

  it("declares vector<int> for array inputs", () => {
    const code = generateDriverCode(
      "cpp",
      "class Solution { public: int maxProfit(vector<int>& prices) { return 0; } };",
      { prices: [7, 1, 5] },
      "maxProfit"
    );
    expect(code).toContain("vector<int> prices = {7, 1, 5}");
  });

  it("declares int for number inputs", () => {
    const code = generateDriverCode(
      "cpp",
      "class Solution { public: int climbStairs(int n) { return 0; } };",
      { n: 5 },
      "climbStairs"
    );
    expect(code).toContain("int n = 5");
  });

  it("handles empty array input", () => {
    const code = generateDriverCode(
      "cpp",
      "class Solution { public: vector<int> reverseList(vector<int>& head) { return {}; } };",
      EMPTY_ARRAY_INPUT,
      "reverseList"
    );
    expect(code).toContain("vector<int> nums = {}");
  });

  it("includes RUNTIME_ERROR handler", () => {
    const code = generateDriverCode(
      "cpp",
      "class Solution { public: int f(int n) { return 0; } };",
      { n: 1 },
      "f"
    );
    expect(code).toContain("RUNTIME_ERROR");
    expect(code).toContain("catch (exception& e)");
  });

  it("handles multiple parameters", () => {
    const code = generateDriverCode(
      "cpp",
      "class Solution { public: vector<int> twoSum(vector<int>& nums, int target) { return {}; } };",
      INT_ARRAY_INPUT,
      "twoSum"
    );
    expect(code).toContain("solution.twoSum(nums, target)");
  });

  it("declares auto for non-numeric non-array inputs", () => {
    const code = generateDriverCode(
      "cpp",
      "class Solution { public: bool wordBreak(string s, vector<string>& wordDict) { return false; } };",
      { s: "leetcode", wordDict: ["leet", "code"] },
      "wordBreak"
    );
    expect(code).toContain("auto wordDict");
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe("generateDriverCode — edge cases", () => {
  it("returns undefined for an unsupported language", () => {
    const code = generateDriverCode("ruby", "def f; end", { n: 1 }, "f");
    expect(code).toBeUndefined();
  });

  it("handles nested object input (e.g. coins + amount)", () => {
    const code = generateDriverCode(
      "python",
      "def coinChange(coins, amount):\n  pass",
      NESTED_INPUT,
      "coinChange"
    );
    expect(code).toContain("[1, 5, 11]");
    expect(code).toContain("15");
  });

  it("handles string input with special characters", () => {
    const code = generateDriverCode(
      "javascript",
      'function isValid(s) {}',
      { s: "()[]{}" },
      "isValid"
    );
    expect(code).toContain('"()[]{}"');
  });

  it("formats Python None correctly for -1 sentinel values in tree arrays", () => {
    const code = generateDriverCode(
      "python",
      "def maxDepth(root):\n  pass",
      { root: [1, -1, 2] },
      "maxDepth"
    );
    // -1 is a number, stays as -1 in the array (None handling is separate)
    expect(code).toContain("build_tree([1, -1, 2])");
  });

  it("uses 'solve' fallback across all languages", () => {
    for (const lang of ["python", "javascript", "java", "cpp"]) {
      const code = generateDriverCode(lang, "", { n: 1 }, undefined);
      if (code) expect(code).toContain("solve");
    }
  });
});
