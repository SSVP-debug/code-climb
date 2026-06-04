const hiddenTestcases = {
  "two-sum": [
    { input: { nums: [1, 2, 3, 4, 5], target: 9 }, expectedOutput: [3, 4] },
    { input: { nums: [-1, 0], target: -1 }, expectedOutput: [0, 1] },
  ],

  "contains-duplicate": [
    { input: { nums: [1] }, expectedOutput: false },
    { input: { nums: [1, 1] }, expectedOutput: true },
  ],

  "best-time-to-buy-and-sell-stock": [
    { input: { prices: [2, 4, 1] }, expectedOutput: 2 },
    { input: { prices: [1, 2, 3, 4, 5] }, expectedOutput: 4 },
  ],

  "valid-parentheses": [
    { input: { s: "([)]" }, expectedOutput: false },
    { input: { s: "{[]}" }, expectedOutput: true },
  ],

  "maximum-subarray": [
    { input: { nums: [-1] }, expectedOutput: -1 },
    { input: { nums: [-2, -1] }, expectedOutput: -1 },
  ],

  "climbing-stairs": [
    { input: { n: 1 }, expectedOutput: 1 },
    { input: { n: 10 }, expectedOutput: 89 },
  ],

  "single-number": [
    { input: { nums: [0, 0, 3] }, expectedOutput: 3 },
    { input: { nums: [-1, -1, 5] }, expectedOutput: 5 },
  ],

  "fibonacci-number": [
    { input: { n: 0 }, expectedOutput: 0 },
    { input: { n: 10 }, expectedOutput: 55 },
  ],

  "longest-substring-without-repeating-characters": [
    { input: { s: "" }, expectedOutput: 0 },
    { input: { s: "dvdf" }, expectedOutput: 3 },
  ],

  "valid-anagram": [
    { input: { s: "a", t: "a" }, expectedOutput: true },
    { input: { s: "listen", t: "silent" }, expectedOutput: true },
  ],

  "container-with-most-water": [
    { input: { height: [1, 2, 1] }, expectedOutput: 2 },
    { input: { height: [2, 3, 4, 5, 18, 17, 6] }, expectedOutput: 17 },
  ],

  "house-robber": [
    { input: { nums: [2, 1, 1, 2] }, expectedOutput: 4 },
    { input: { nums: [1] }, expectedOutput: 1 },
  ],

  "coin-change": [
    { input: { coins: [1], amount: 0 }, expectedOutput: 0 },
    { input: { coins: [2, 5, 10, 1], amount: 27 }, expectedOutput: 4 },
  ],

  "find-minimum-in-rotated-sorted-array": [
    { input: { nums: [1] }, expectedOutput: 1 },
    { input: { nums: [2, 1] }, expectedOutput: 1 },
  ],

  "majority-element": [
    { input: { nums: [6, 5, 5] }, expectedOutput: 5 },
    { input: { nums: [1, 1, 1, 2, 3] }, expectedOutput: 1 },
  ],

  "longest-common-prefix": [
    { input: { strs: ["a"] }, expectedOutput: "a" },
    { input: { strs: ["ab", "a"] }, expectedOutput: "a" },
  ],

  "trapping-rain-water": [
    { input: { height: [1, 0, 1] }, expectedOutput: 1 },
    { input: { height: [2, 0, 2] }, expectedOutput: 2 },
  ],

  "word-break": [
    { input: { s: "a", wordDict: ["a"] }, expectedOutput: true },
    { input: { s: "bb", wordDict: ["a", "b", "bbb", "bbbb"] }, expectedOutput: true },
  ],

  "decode-ways": [
    { input: { s: "1" }, expectedOutput: 1 },
    { input: { s: "11106" }, expectedOutput: 2 },
  ],

  "jump-game-ii": [
    { input: { nums: [1, 1, 1, 1] }, expectedOutput: 3 },
    { input: { nums: [1, 2, 1, 1, 1] }, expectedOutput: 3 },
  ],
};

export default hiddenTestcases;
