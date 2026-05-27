import { describe, expect, it } from "vitest";
import { generateDriverCode } from "./generateDriverCode";

describe("generateDriverCode", () => {
  const input = {
    nums: [2, 7, 11, 15],
    target: 9,
  };

  it("wraps python with function call and json output", () => {
    const code = generateDriverCode(
      "python",
      "def twoSum(nums, target):\n  pass",
      input,
      "twoSum"
    );

    expect(code).toContain("twoSum");
    expect(code).toContain("json.dumps");
    expect(code).toContain("[2,7,11,15]");
  });

  it("wraps javascript with function call", () => {
    const code = generateDriverCode(
      "javascript",
      "function twoSum(nums, target) {}",
      input,
      "twoSum"
    );

    expect(code).toContain("JSON.stringify");
    expect(code).toContain("twoSum");
  });

  it("wraps java with Main class", () => {
    const code = generateDriverCode(
      "java",
      "class Solution { public int[] twoSum(int[] nums, int target) { return new int[0]; } }",
      input,
      "twoSum"
    );

    expect(code).toContain("class Main");
    expect(code).toContain("solution.twoSum");
  });

  it("wraps cpp with main", () => {
    const code = generateDriverCode(
      "cpp",
      "class Solution { public: vector<int> twoSum(vector<int>& nums, int target) { return {}; } };",
      input,
      "twoSum"
    );

    expect(code).toContain("int main()");
    expect(code).toContain("solution.twoSum");
  });
});
