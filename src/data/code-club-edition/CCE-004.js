/**
 * CCE-004 — "The Vault Countdown"
 * See CCE-001.js for the file-per-mission convention this follows.
 */

export default {
  id: 90004,
  campaignCode: "CCE-004",
  title: "The Vault Countdown",
  slug: "the-vault-countdown",
  functionName: "bestHeistWindow",
  difficulty: "Medium",
  topic: "Arrays",
  pattern: "kadane's algorithm",
  sourceType: "original",
  description:
    "The crew has a minute-by-minute log of gains and losses while the vault is briefly open. Before it reseals, find the best contiguous stretch of minutes that maximizes total gain, and return that sum. You must pick at least one minute.",
  examples: [
    { input: "changes = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "[4,-1,2,1] sums to 6." },
    { input: "changes = [5,4,-1,7,8]", output: "23" },
  ],
  constraints: ["1 <= changes.length <= 10^5", "-10^4 <= changes[i] <= 10^4"],
  starterCode: {
    python: `class Solution:\n    def bestHeistWindow(self, changes):\n        pass`,
    javascript: `function bestHeistWindow(changes) {\n\n}`,
    java: `class Solution {\n    public int bestHeistWindow(int[] changes) {\n        return 0;\n    }\n}`,
    cpp: `class Solution {\npublic:\n    int bestHeistWindow(vector<int>& changes) {\n        return 0;\n    }\n};`,
  },
  testcases: [
    { input: { changes: [-2, 1, -3, 4, -1, 2, 1, -5, 4] }, expectedOutput: 6 },
    { input: { changes: [1] }, expectedOutput: 1 },
    { input: { changes: [5, 4, -1, 7, 8] }, expectedOutput: 23 },
  ],
  hiddentestcases: [
    { input: { changes: [-1, -2, -3] }, expectedOutput: -1 },
    { input: { changes: [3, -2, 5, -1] }, expectedOutput: 6 },
  ],
};