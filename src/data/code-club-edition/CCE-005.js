/**
 * CCE-005 — "Trace the Intrusion"
 * See CCE-001.js for the file-per-mission convention this follows.
 */

export default {
  id: 90005,
  campaignCode: "CCE-005",
  title: "Trace the Intrusion",
  slug: "trace-the-intrusion",
  functionName: "countMalwareClusters",
  difficulty: "Medium",
  topic: "Graphs",
  pattern: "dfs / bfs on grid",
  sourceType: "original",
  description:
    "A network monitor flags infected nodes across a grid of servers, flattened to a 1D array of 0s (clean) and 1s (infected) with numCols columns. Two infected nodes are part of the same cluster if they're adjacent horizontally or vertically. Return the number of distinct malware clusters.",
  examples: [
    { input: "grid = [1,1,0,0, 1,0,0,1, 0,0,1,1, 0,0,0,0], numCols = 4", output: "2" },
    { input: "grid = [1,0,1, 0,1,0, 1,0,1], numCols = 3", output: "5" },
  ],
  constraints: ["1 <= grid.length <= 90000", "numCols divides grid.length evenly", "grid[i] is 0 or 1"],
  starterCode: {
    python: `class Solution:\n    def countMalwareClusters(self, grid, numCols):\n        # grid is a flat list of 0s and 1s\n        pass`,
    javascript: `function countMalwareClusters(grid, numCols) {\n  // grid is a flat array of 0s and 1s\n}`,
    java: `class Solution {\n    public int countMalwareClusters(int[] grid, int numCols) {\n        return 0;\n    }\n}`,
    cpp: `class Solution {\npublic:\n    int countMalwareClusters(vector<int>& grid, int numCols) {\n        return 0;\n    }\n};`,
  },
  testcases: [
    { input: { grid: [1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0], numCols: 4 }, expectedOutput: 2 },
    { input: { grid: [1, 0, 1, 0, 1, 0, 1, 0, 1], numCols: 3 }, expectedOutput: 5 },
  ],
  hiddentestcases: [
    { input: { grid: new Array(20).fill(0), numCols: 5 }, expectedOutput: 0 },
    { input: { grid: [1, 1, 1], numCols: 1 }, expectedOutput: 1 },
  ],
};