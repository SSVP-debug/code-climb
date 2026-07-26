/**
 * CCE-008 — "The Last Firewall"
 * See CCE-001.js for the file-per-mission convention this follows.
 */

export default {
  id: 90008,
  campaignCode: "CCE-008",
  title: "The Last Firewall",
  slug: "the-last-firewall",
  functionName: "findBreachTimestamp",
  difficulty: "Medium",
  topic: "Binary Search",
  pattern: "binary search",
  sourceType: "original",
  description:
    "Server logs are sorted chronologically by timestamp. Given the sorted log timestamps and the exact timestamp of a known breach, return its index in the logs, or -1 if it isn't present. Your solution must run in O(log n) time.",
  examples: [
    { input: "logs = [10,20,30,40,50], target = 30", output: "2" },
    { input: "logs = [2,4,6], target = 5", output: "-1" },
  ],
  constraints: ["0 <= logs.length <= 10^5", "logs is sorted in strictly increasing order", "-10^9 <= logs[i], target <= 10^9"],
  starterCode: {
    python: `class Solution:\n    def findBreachTimestamp(self, logs, target):\n        pass`,
    javascript: `function findBreachTimestamp(logs, target) {\n\n}`,
    java: `class Solution {\n    public int findBreachTimestamp(int[] logs, int target) {\n        return -1;\n    }\n}`,
    cpp: `class Solution {\npublic:\n    int findBreachTimestamp(vector<int>& logs, int target) {\n        return -1;\n    }\n};`,
  },
  testcases: [
    { input: { logs: [10, 20, 30, 40, 50], target: 30 }, expectedOutput: 2 },
    { input: { logs: [1, 3, 5, 7, 9, 11], target: 7 }, expectedOutput: 3 },
    { input: { logs: [2, 4, 6], target: 5 }, expectedOutput: -1 },
  ],
  hiddentestcases: [
    { input: { logs: [], target: 1 }, expectedOutput: -1 },
    { input: { logs: [9], target: 9 }, expectedOutput: 0 },
  ],
};