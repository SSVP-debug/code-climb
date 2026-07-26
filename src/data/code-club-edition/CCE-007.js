/**
 * CCE-007 — "Signal Decoder"
 * See CCE-001.js for the file-per-mission convention this follows.
 */

export default {
  id: 90007,
  campaignCode: "CCE-007",
  title: "Signal Decoder",
  slug: "signal-decoder",
  functionName: "reverseSignalChain",
  difficulty: "Easy",
  topic: "Linked List",
  pattern: "iterative pointer reversal",
  sourceType: "original",
  description:
    "You've intercepted a signal chain represented as a singly linked list (given as an array). Reverse the chain in place and return the reversed array — reversing the order the packets should now be read in.",
  examples: [
    { input: "chain = [3,7,2,9]", output: "[9,2,7,3]" },
    { input: "chain = [1]", output: "[1]" },
  ],
  constraints: ["0 <= chain.length <= 5000", "-5000 <= chain[i] <= 5000"],
  starterCode: {
    python: `class Solution:\n    def reverseSignalChain(self, chain):\n        pass`,
    javascript: `function reverseSignalChain(chain) {\n\n}`,
    java: `class Solution {\n    public int[] reverseSignalChain(int[] chain) {\n        return new int[]{};\n    }\n}`,
    cpp: `class Solution {\npublic:\n    vector<int> reverseSignalChain(vector<int>& chain) {\n        return {};\n    }\n};`,
  },
  testcases: [
    { input: { chain: [3, 7, 2, 9] }, expectedOutput: [9, 2, 7, 3] },
    { input: { chain: [1] }, expectedOutput: [1] },
    { input: { chain: [] }, expectedOutput: [] },
  ],
  hiddentestcases: [
    { input: { chain: [5, 5, 5] }, expectedOutput: [5, 5, 5] },
    { input: { chain: [1, 2, 3, 4, 5, 6, 7] }, expectedOutput: [7, 6, 5, 4, 3, 2, 1] },
  ],
};