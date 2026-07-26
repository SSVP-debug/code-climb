/**
 * CCE-002 — "The Duplicate Suspect"
 * See CCE-001.js for the file-per-mission convention this follows.
 */

export default {
  id: 90002,
  campaignCode: "CCE-002",
  title: "The Duplicate Suspect",
  slug: "the-duplicate-suspect",
  functionName: "hasDuplicateSuspect",
  difficulty: "Easy",
  topic: "Hashing",
  pattern: "set membership scan",
  sourceType: "original",
  description:
    "A scanner logs the badge ID of every suspect who entered the building. Return true if any badge ID was scanned more than once, meaning the same suspect entered twice.",
  examples: [
    { input: "badgeIds = [101,205,309,205]", output: "true" },
    { input: "badgeIds = [7,8,9,10]", output: "false" },
  ],
  constraints: ["1 <= badgeIds.length <= 10^5", "-10^9 <= badgeIds[i] <= 10^9"],
  starterCode: {
    python: `class Solution:\n    def hasDuplicateSuspect(self, badgeIds):\n        pass`,
    javascript: `function hasDuplicateSuspect(badgeIds) {\n\n}`,
    java: `class Solution {\n    public boolean hasDuplicateSuspect(int[] badgeIds) {\n        return false;\n    }\n}`,
    cpp: `class Solution {\npublic:\n    bool hasDuplicateSuspect(vector<int>& badgeIds) {\n        return false;\n    }\n};`,
  },
  testcases: [
    { input: { badgeIds: [101, 205, 309, 205] }, expectedOutput: true },
    { input: { badgeIds: [7, 8, 9, 10] }, expectedOutput: false },
    { input: { badgeIds: [42] }, expectedOutput: false },
  ],
  hiddentestcases: [
    { input: { badgeIds: [5, 5, 5, 5] }, expectedOutput: true },
    { input: { badgeIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 1] }, expectedOutput: true },
  ],
};