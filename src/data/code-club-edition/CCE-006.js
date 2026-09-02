/**
 * CCE-006 — "Firewall Breach Order"
 * See CCE-001.js for the file-per-mission convention this follows.
 */

export default {
  id: 90006,
  campaignCode: "CCE-006",
  title: "Firewall Breach Order",
  slug: "firewall-breach-order",
  functionName: "canApplyPatches",
  difficulty: "Medium",
  topic: "Graphs",
  pattern: "topological sort / cycle detection",
  sourceType: "original",
  description:
    "There are numPatches security patches (0 to numPatches-1) queued for install. dependencies[i] = [a, b] means patch a can only be installed after patch b. Return true if there's a valid order to install every patch (i.e. the dependency graph has no cycle), false otherwise.",
  examples: [
    { input: "numPatches = 2, dependencies = [[1,0]]", output: "true" },
    { input: "numPatches = 2, dependencies = [[1,0],[0,1]]", output: "false" },
  ],
  constraints: ["1 <= numPatches <= 2000", "0 <= dependencies.length <= 5000", "dependencies[i].length == 2"],
  starterCode: {
    python: `class Solution:\n    def canApplyPatches(self, numPatches, dependencies):\n        pass`,
    javascript: `function canApplyPatches(numPatches, dependencies) {\n\n}`,
    typescript: `function canApplyPatches(numPatches, dependencies) {\n\n}`,
    java: `class Solution {\n    public boolean canApplyPatches(int numPatches, int[][] dependencies) {\n        return false;\n    }\n}`,
    cpp: `class Solution {\npublic:\n    bool canApplyPatches(int numPatches, vector<vector<int>>& dependencies) {\n        return false;\n    }\n};`,
  },
  testcases: [
    { input: { numPatches: 2, dependencies: [[1, 0]] }, expectedOutput: true },
    { input: { numPatches: 2, dependencies: [[1, 0], [0, 1]] }, expectedOutput: false },
    { input: { numPatches: 4, dependencies: [[1, 0], [2, 1], [3, 2]] }, expectedOutput: true },
  ],
  hiddentestcases: [
    { input: { numPatches: 3, dependencies: [] }, expectedOutput: true },
    { input: { numPatches: 3, dependencies: [[0, 1], [1, 2], [2, 0]] }, expectedOutput: false },
  ],
};