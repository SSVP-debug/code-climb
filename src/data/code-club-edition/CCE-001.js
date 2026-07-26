/**
 * CCE-001 — "The Torn Ledger"
 *
 * Code Club Edition mission. Lives in its own file, in its own directory,
 * with its own id range (90001+) and its own campaignCode ("CCE-001") —
 * physically separate from the standard interview catalog in
 * src/data/problems.js so the two collections can be maintained, seeded,
 * expanded, and versioned independently, even though both are plain
 * Problem documents running through the exact same execution engine,
 * workspace, submissions, and progress tracking.
 *
 * Story framing (mission title, one-line intro, chapter placement) is
 * NOT here — that lives in src/data/codeClubEdition.js, keyed by this
 * mission's `slug`. This file only ever contains the technical problem
 * statement, same shape as any other Problem document.
 */

export default {
  id: 90001,
  campaignCode: "CCE-001",
  title: "The Torn Ledger",
  slug: "the-torn-ledger",
  functionName: "findLedgerPair",
  difficulty: "Easy",
  topic: "Hashing",
  pattern: "hash map complement lookup",
  sourceType: "original",
  description:
    "You're given a list of amounts recovered from a torn ledger, and a target figure written on the safe. Find the two entries that add up exactly to the target and return their indices.\n\nAssume exactly one valid pair exists, and you may not use the same entry twice. Return the indices in the order you find them while scanning left to right.",
  examples: [
    { input: "amounts = [15,40,25,60], target = 65", output: "[1,2]", explanation: "40 + 25 = 65" },
    { input: "amounts = [10,10,20], target = 20", output: "[0,1]", explanation: "10 + 10 = 20" },
  ],
  constraints: ["2 <= amounts.length <= 10^4", "-10^9 <= amounts[i] <= 10^9", "Exactly one valid pair exists."],
  starterCode: {
    python: `class Solution:\n    def findLedgerPair(self, amounts, target):\n        pass`,
    javascript: `function findLedgerPair(amounts, target) {\n\n}`,
    java: `class Solution {\n    public int[] findLedgerPair(int[] amounts, int target) {\n        return new int[]{};\n    }\n}`,
    cpp: `class Solution {\npublic:\n    vector<int> findLedgerPair(vector<int>& amounts, int target) {\n        return {};\n    }\n};`,
  },
  testcases: [
    { input: { amounts: [15, 40, 25, 60], target: 65 }, expectedOutput: [1, 2] },
    { input: { amounts: [10, 10, 20], target: 20 }, expectedOutput: [0, 1] },
    { input: { amounts: [5, 3, 4, 8], target: 12 }, expectedOutput: [2, 3] },
  ],
  hiddentestcases: [
    { input: { amounts: [100, 200, 300, 150], target: 350 }, expectedOutput: [1, 3] },
    { input: { amounts: [1, 2, 3, 4, 5], target: 9 }, expectedOutput: [3, 4] },
  ],
};