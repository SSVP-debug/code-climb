const hiddentestcases = {
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

  "move-zeroes": [
    { input: { nums: [0, 0, 1] }, expectedOutput: [1, 0, 0] },
    { input: { nums: [4, 2, 0, 1, 0, 5] }, expectedOutput: [4, 2, 1, 5, 0, 0] },
  ],

  "min-stack": [
    { input: { ops: [["push", 10], ["push", 5], ["push", 15], ["getMin"], ["pop"], ["getMin"], ["top"]] }, expectedOutput: [5, 5, 10] },
  ],

  "daily-temperatures": [
    { input: { temperatures: [89, 62, 70, 58, 47, 47, 46, 76, 100, 70] }, expectedOutput: [8, 1, 5, 4, 3, 2, 1, 1, 0, 0] },
  ],

  "reverse-linked-list": [
    { input: { head: [1] }, expectedOutput: [1] },
    { input: { head: [3, 1, 4, 1, 5, 9, 2, 6] }, expectedOutput: [6, 2, 9, 5, 1, 4, 1, 3] },
  ],

  "merge-two-sorted-lists": [
    { input: { list1: [1], list2: [2] }, expectedOutput: [1, 2] },
    { input: { list1: [1, 3, 5, 7], list2: [2, 4, 6, 8] }, expectedOutput: [1, 2, 3, 4, 5, 6, 7, 8] },
  ],

  "middle-of-the-linked-list": [
    { input: { head: [1, 2] }, expectedOutput: 2 },
    { input: { head: [10, 20, 30, 40] }, expectedOutput: 30 },
  ],

  "remove-nth-node-from-end": [
    { input: { head: [1, 2], n: 2 }, expectedOutput: [2] },
    { input: { head: [1, 2, 3, 4, 5], n: 5 }, expectedOutput: [2, 3, 4, 5] },
  ],

  "two-sum-ii-sorted": [
    { input: { numbers: [1, 2, 3, 4, 5], target: 9 }, expectedOutput: [4, 5] },
    { input: { numbers: [5, 25, 75], target: 100 }, expectedOutput: [2, 3] },
  ],

  "three-sum": [
    { input: { nums: [-2, 0, 1, 1, 2] }, expectedOutput: 2 },
    { input: { nums: [1, 2, -2, -1] }, expectedOutput: 0 },
  ],

  "minimum-size-subarray-sum": [
    { input: { target: 15, nums: [1, 2, 3, 4, 5] }, expectedOutput: 5 },
    { input: { target: 6, nums: [10, 2, 3] }, expectedOutput: 1 },
  ],

  "maximum-average-subarray": [
    { input: { nums: [3, 3, 3, 3, 3], k: 3 }, expectedOutput: 3 },
    { input: { nums: [-1, -12, -5], k: 2 }, expectedOutput: -6.5 },
  ],

  "binary-search": [
    { input: { nums: [1, 3, 5, 7, 9, 11], target: 7 }, expectedOutput: 3 },
    { input: { nums: [2, 4, 6, 8, 10], target: 1 }, expectedOutput: -1 },
  ],

  "search-in-rotated-sorted-array": [
    { input: { nums: [3, 1], target: 1 }, expectedOutput: 1 },
    { input: { nums: [5, 1, 3], target: 5 }, expectedOutput: 0 },
  ],

  "group-anagrams": [
    { input: { strs: ["abc", "bca", "cab", "xyz"] }, expectedOutput: 2 },
    { input: { strs: ["a", "b", "c"] }, expectedOutput: 3 },
  ],

  "longest-consecutive-sequence": [
    { input: { nums: [1, 2, 3, 4, 5] }, expectedOutput: 5 },
    { input: { nums: [9, 1, 4, 7, 3, -1, 0, 5, 8, -1, 6] }, expectedOutput: 7 },
  ],

  "two-sum-count-pairs": [
    { input: { nums: [0, 0, 0, 0], target: 0 }, expectedOutput: 6 },
    { input: { nums: [5, 5, 5, 5, 5], target: 10 }, expectedOutput: 10 },
  ],

  "reverse-string": [
    { input: { s: "abcde" }, expectedOutput: "edcba" },
    { input: { s: "racecar" }, expectedOutput: "racecar" },
  ],

  "is-palindrome": [
    { input: { s: "Was it a car or a cat I saw?" }, expectedOutput: true },
    { input: { s: "hello" }, expectedOutput: false },
  ],

  "kth-largest-element": [
    { input: { nums: [5, 2, 4, 1, 3, 6, 0], k: 3 }, expectedOutput: 4 },
    { input: { nums: [7, 6, 5, 4, 3, 2, 1], k: 5 }, expectedOutput: 3 },
  ],

  "last-stone-weight": [
    { input: { stones: [10, 4, 2, 10] }, expectedOutput: 2 },
    { input: { stones: [1, 1, 1, 1] }, expectedOutput: 0 },
  ],

  "subsets": [
    { input: { nums: [1, 2, 3, 4] }, expectedOutput: 16 },
    { input: { nums: [5] }, expectedOutput: 2 },
  ],

  "combination-sum": [
    { input: { candidates: [3, 5, 7], target: 12 }, expectedOutput: 2 },
    { input: { candidates: [1, 2], target: 4 }, expectedOutput: 4 },
  ],

  "letter-case-permutations": [
    { input: { s: "abc" }, expectedOutput: 8 },
    { input: { s: "C" }, expectedOutput: 2 },
  ],

  "maximum-depth-of-binary-tree": [
    { input: { root: [1] }, expectedOutput: 1 },
    { input: { root: [1, 2, 3, 4, 5] }, expectedOutput: 3 },
  ],

  "invert-binary-tree": [
    { input: { root: [1] }, expectedOutput: [1] },
    { input: { root: [1, 2, -1] }, expectedOutput: [1, -1, 2] },
  ],

  "diameter-of-binary-tree": [
    { input: { root: [1, 2, 3, 4, 5, -1, -1, 6] }, expectedOutput: 4 },
    { input: { root: [1, -1, 2, -1, -1, -1, 3] }, expectedOutput: 2 },
  ],

  "validate-binary-search-tree": [
    { input: { root: [5, 4, 6, -1, -1, 3, 7] }, expectedOutput: false },
    { input: { root: [10, 5, 15, -1, -1, 12, 20] }, expectedOutput: true },
  ],

  "same-tree": [
    { input: { p: [], q: [] }, expectedOutput: true },
    { input: { p: [1], q: [1] }, expectedOutput: true },
  ],

  "flood-fill": [
    { input: { image: [0, 0, 0, 0, 1, 1, 0, 1, 1], numCols: 3, sr: 1, sc: 1, color: 5 }, expectedOutput: [0, 0, 0, 0, 5, 5, 0, 5, 5] },
  ],

  "number-of-islands": [
    { input: { grid: [0, 0, 0, 0, 0], numCols: 5 }, expectedOutput: 0 },
    { input: { grid: [1, 0, 1, 0, 1], numCols: 5 }, expectedOutput: 3 },
  ],
};

export default hiddentestcases;