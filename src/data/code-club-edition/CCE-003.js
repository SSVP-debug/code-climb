/**
 * CCE-003 — "The Guard's Password"
 * See CCE-001.js for the file-per-mission convention this follows.
 */

export default {
  id: 90003,
  campaignCode: "CCE-003",
  title: "The Guard's Password",
  slug: "the-guards-password",
  functionName: "isValidLockCode",
  difficulty: "Easy",
  topic: "Stacks",
  pattern: "stack bracket matching",
  sourceType: "original",
  description:
    "The vault's lock accepts a code made of three bracket types: (), [], {}. The code only unlocks the vault if every bracket is closed by the same type of bracket, in the correct order. Return whether the code is valid.",
  examples: [
    { input: 'code = "()[]{}"', output: "true" },
    { input: 'code = "(]"', output: "false" },
    { input: 'code = "([)]"', output: "false" },
  ],
  constraints: ["1 <= code.length <= 10^4", "code consists only of '()[]{}'"],
  starterCode: {
    python: `class Solution:\n    def isValidLockCode(self, code):\n        pass`,
    javascript: `function isValidLockCode(code) {\n\n}`,
    java: `class Solution {\n    public boolean isValidLockCode(String code) {\n        return false;\n    }\n}`,
    cpp: `class Solution {\npublic:\n    bool isValidLockCode(string code) {\n        return false;\n    }\n};`,
  },
  testcases: [
    { input: { code: "()[]{}" }, expectedOutput: true },
    { input: { code: "(]" }, expectedOutput: false },
    { input: { code: "([)]" }, expectedOutput: false },
    { input: { code: "{[]}" }, expectedOutput: true },
  ],
  hiddentestcases: [
    { input: { code: "" }, expectedOutput: true },
    { input: { code: "(((" }, expectedOutput: false },
  ],
};