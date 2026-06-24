/**
 * problems.js — Code Club problem catalog
 *
 * This file is the single source of truth for all problems.
 * It is imported by:
 *   - backend/scripts/seedProblems.js  (seeds MongoDB)
 *   - src/hooks/useProblems.js         (fallback if API unreachable)
 *
 * Fields:
 *   testcases        — visible to client, used in Run mode
 *   hiddentestcases  — server-only, used in Submit mode (never sent to client)
 *   estimatedTime    — rough time budget for a prepared candidate
 *   companies        — companies known to ask this in interviews
 *   relatedProblems  — slugs of thematically linked problems on this platform
 *   hints            — progressive hints, ordered from vague → specific
 */

import problemMetadata from "./problemMetadata.js";

const rawProblems = [

  // ── ARRAYS ────────────────────────────────────────────────────────────────

  {
    id: 1,
    title: "Two Sum",
    slug: "two-sum",
    functionName: "twoSum",
    difficulty: "Easy",
    topic: "Arrays",
    pattern: "hash map complement",
    sourceType: "core",
    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input has exactly one solution, and you may not use the same element twice.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] = 9" },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
    ],
    constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "Only one valid answer exists."],
    starterCode: {
      python: `class Solution:\n    def twoSum(self, nums, target):\n        pass`,
      javascript: `function twoSum(nums, target) {\n\n}`,
      java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[]{};\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        return {};\n    }\n};`,
    },
    testcases: [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] },
      { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2] },
      { input: { nums: [3, 3], target: 6 }, expectedOutput: [0, 1] },
    ],
    hiddentestcases: [
      { input: { nums: [1, 5, 3, 7], target: 8 }, expectedOutput: [1, 3] },
      { input: { nums: [0, 4, 3, 0], target: 0 }, expectedOutput: [0, 3] },
    ],
  },

  {
    id: 2,
    title: "Contains Duplicate",
    slug: "contains-duplicate",
    functionName: "containsDuplicate",
    difficulty: "Easy",
    topic: "Arrays",
    pattern: "hash set",
    sourceType: "core",
    description:
      "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
    examples: [
      { input: "nums = [1,2,3,1]", output: "true" },
      { input: "nums = [1,2,3,4]", output: "false" },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
    starterCode: {
      python: `class Solution:\n    def containsDuplicate(self, nums):\n        pass`,
      javascript: `function containsDuplicate(nums) {\n\n}`,
      java: `class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        return false;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        return false;\n    }\n};`,
    },
    testcases: [
      { input: { nums: [1, 2, 3, 1] }, expectedOutput: true },
      { input: { nums: [1, 2, 3, 4] }, expectedOutput: false },
      { input: { nums: [1, 1, 1, 3, 3, 4, 3, 2, 4, 2] }, expectedOutput: true },
    ],
    hiddentestcases: [
      { input: { nums: [1] }, expectedOutput: false },
      { input: { nums: [2, 2] }, expectedOutput: true },
    ],
  },

  {
    id: 3,
    title: "Best Time to Buy and Sell Stock",
    slug: "best-time-to-buy-and-sell-stock",
    functionName: "maxProfit",
    difficulty: "Easy",
    topic: "Arrays",
    pattern: "sliding window / greedy",
    sourceType: "core",
    description:
      "You are given an array prices where prices[i] is the price of a stock on day i. Maximize your profit by choosing a single day to buy and a different future day to sell. Return the maximum profit, or 0 if no profit is possible.",
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "Buy day 2 (price=1), sell day 5 (price=6). Profit = 5." },
      { input: "prices = [7,6,4,3,1]", output: "0" },
    ],
    constraints: ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
    starterCode: {
      python: `class Solution:\n    def maxProfit(self, prices):\n        pass`,
      javascript: `function maxProfit(prices) {\n\n}`,
      java: `class Solution {\n    public int maxProfit(int[] prices) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { prices: [7, 1, 5, 3, 6, 4] }, expectedOutput: 5 },
      { input: { prices: [7, 6, 4, 3, 1] }, expectedOutput: 0 },
      { input: { prices: [1, 2] }, expectedOutput: 1 },
    ],
    hiddentestcases: [
      { input: { prices: [2, 4, 1] }, expectedOutput: 2 },
      { input: { prices: [1, 1, 1] }, expectedOutput: 0 },
    ],
  },

  {
    id: 5,
    title: "Maximum Subarray",
    slug: "maximum-subarray",
    functionName: "maxSubArray",
    difficulty: "Easy",
    topic: "Arrays",
    pattern: "kadane's algorithm",
    sourceType: "core",
    description:
      "Given an integer array nums, find the contiguous subarray with the largest sum and return its sum. Hint: Kadane's algorithm solves this in O(n).",
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "[4,-1,2,1] has the largest sum." },
      { input: "nums = [1]", output: "1" },
      { input: "nums = [5,4,-1,7,8]", output: "23" },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    starterCode: {
      python: `class Solution:\n    def maxSubArray(self, nums):\n        pass`,
      javascript: `function maxSubArray(nums) {\n\n}`,
      java: `class Solution {\n    public int maxSubArray(int[] nums) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] }, expectedOutput: 6 },
      { input: { nums: [1] }, expectedOutput: 1 },
      { input: { nums: [5, 4, -1, 7, 8] }, expectedOutput: 23 },
    ],
    hiddentestcases: [
      { input: { nums: [-1, -2, -3] }, expectedOutput: -1 },
      { input: { nums: [1, 2, 3, 4, 5] }, expectedOutput: 15 },
    ],
  },

  {
    id: 15,
    title: "Majority Element",
    slug: "majority-element",
    functionName: "majorityElement",
    difficulty: "Easy",
    topic: "Arrays",
    pattern: "boyer-moore voting",
    sourceType: "core",
    description:
      "Given an array nums of size n, return the majority element — the element that appears more than n/2 times. The majority element always exists. Try solving it in O(n) time and O(1) space using Boyer-Moore Voting Algorithm.",
    examples: [
      { input: "nums = [3,2,3]", output: "3" },
      { input: "nums = [2,2,1,1,1,2,2]", output: "2" },
    ],
    constraints: ["n == nums.length", "1 <= n <= 5 * 10^4", "The majority element always exists."],
    starterCode: {
      python: `class Solution:\n    def majorityElement(self, nums):\n        pass`,
      javascript: `function majorityElement(nums) {\n\n}`,
      java: `class Solution {\n    public int majorityElement(int[] nums) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int majorityElement(vector<int>& nums) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { nums: [3, 2, 3] }, expectedOutput: 3 },
      { input: { nums: [2, 2, 1, 1, 1, 2, 2] }, expectedOutput: 2 },
      { input: { nums: [1] }, expectedOutput: 1 },
    ],
    hiddentestcases: [
      { input: { nums: [6, 6, 6, 7, 5] }, expectedOutput: 6 },
      { input: { nums: [1, 1, 2, 1, 3, 1, 1] }, expectedOutput: 1 },
    ],
  },

  {
    id: 32,
    title: "Move Zeroes",
    slug: "move-zeroes",
    functionName: "moveZeroes",
    difficulty: "Easy",
    topic: "Arrays",
    pattern: "two pointers",
    sourceType: "core",
    description:
      "Given an integer array nums, move all 0s to the end while maintaining the relative order of the non-zero elements. Do this in-place and return the modified array.\n\nUse a slow pointer that tracks the next position for a non-zero element. Iterate with a fast pointer — whenever you find a non-zero, place it at the slow pointer position.",
    examples: [
      { input: "nums = [0,1,0,3,12]", output: "[1,3,12,0,0]" },
      { input: "nums = [0]", output: "[0]" },
    ],
    constraints: ["1 <= nums.length <= 10^4", "-2^31 <= nums[i] <= 2^31 - 1"],
    starterCode: {
      python: `class Solution:\n    def moveZeroes(self, nums):\n        pass`,
      javascript: `function moveZeroes(nums) {\n\n}`,
      java: `class Solution {\n    public int[] moveZeroes(int[] nums) {\n        return new int[]{};\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> moveZeroes(vector<int>& nums) {\n        return {};\n    }\n};`,
    },
    testcases: [
      { input: { nums: [0, 1, 0, 3, 12] }, expectedOutput: [1, 3, 12, 0, 0] },
      { input: { nums: [0] }, expectedOutput: [0] },
      { input: { nums: [1, 2, 3] }, expectedOutput: [1, 2, 3] },
    ],
    hiddentestcases: [
      { input: { nums: [0, 0, 1] }, expectedOutput: [1, 0, 0] },
      { input: { nums: [4, 2, 0, 1, 0, 5] }, expectedOutput: [4, 2, 1, 5, 0, 0] },
    ],
  },

  // ── STACKS ────────────────────────────────────────────────────────────────

  {
    id: 4,
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    functionName: "isValid",
    difficulty: "Easy",
    topic: "Stacks",
    pattern: "stack matching",
    sourceType: "core",
    description:
      "Given a string s containing only '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Open brackets must be closed by the same type of brackets in the correct order.",
    examples: [
      { input: 's = "()"', output: "true" },
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" },
    ],
    constraints: ["1 <= s.length <= 10^4", "s consists of parentheses only '()[]{}'."],
    starterCode: {
      python: `class Solution:\n    def isValid(self, s):\n        pass`,
      javascript: `function isValid(s) {\n\n}`,
      java: `class Solution {\n    public boolean isValid(String s) {\n        return false;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    bool isValid(string s) {\n        return false;\n    }\n};`,
    },
    testcases: [
      { input: { s: "()" }, expectedOutput: true },
      { input: { s: "()[]{}" }, expectedOutput: true },
      { input: { s: "(]" }, expectedOutput: false },
    ],
    hiddentestcases: [
      { input: { s: "([)]" }, expectedOutput: false },
      { input: { s: "{[]}" }, expectedOutput: true },
    ],
  },

  {
    id: 36,
    title: "Min Stack",
    slug: "min-stack",
    functionName: "minStack",
    difficulty: "Medium",
    topic: "Stacks",
    pattern: "auxiliary stack",
    sourceType: "core",
    description:
      "Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.\n\nMaintain a second 'min stack' alongside the main stack. Every time you push a value, also push the current minimum. When you pop, pop both.\n\nYou'll receive an array of operations: ['push', val], ['pop'], ['top'], ['getMin']. Return an array of results for top and getMin calls.",
    examples: [
      { input: 'ops = [["push",5],["push",3],["push",7],["getMin"],["pop"],["getMin"]]', output: "[3,3]" },
      { input: 'ops = [["push",2],["push",0],["getMin"],["pop"],["getMin"]]', output: "[0,2]" },
    ],
    constraints: ["-2^31 <= val <= 2^31 - 1", "top and getMin are only called on non-empty stacks.", "At most 3 * 10^4 calls total."],
    starterCode: {
      python: `class Solution:\n    def minStack(self, ops):\n        # ops: list of ["push", val], ["pop"], ["top"], ["getMin"]\n        # return list of results for "top" and "getMin" calls\n        pass`,
      javascript: `function minStack(ops) {\n  // ops: array of ["push", val], ["pop"], ["top"], ["getMin"]\n  // return array of results for "top" and "getMin" calls\n}`,
      java: `class Solution {\n    public int[] minStack(String[][] ops) {\n        return new int[]{};\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> minStack(vector<vector<string>>& ops) {\n        return {};\n    }\n};`,
    },
    testcases: [
      { input: { ops: [["push", 5], ["push", 3], ["push", 7], ["getMin"], ["pop"], ["getMin"]] }, expectedOutput: [3, 3] },
      { input: { ops: [["push", 2], ["push", 0], ["getMin"], ["pop"], ["getMin"]] }, expectedOutput: [0, 2] },
      { input: { ops: [["push", 1], ["top"]] }, expectedOutput: [1] },
    ],
    hiddentestcases: [
      { input: { ops: [["push", 10], ["push", 5], ["push", 15], ["getMin"], ["pop"], ["getMin"], ["top"]] }, expectedOutput: [5, 5, 10] },
    ],
  },

  {
    id: 37,
    title: "Daily Temperatures",
    slug: "daily-temperatures",
    functionName: "dailyTemperatures",
    difficulty: "Medium",
    topic: "Stacks",
    pattern: "monotonic stack",
    sourceType: "core",
    description:
      "Given an array of daily temperatures, return an array where each element is the number of days you have to wait until a warmer temperature. If no future warmer day exists, put 0.\n\nUse a monotonic decreasing stack of indices. When you find a temperature warmer than the stack top, pop and record the difference in indices.",
    examples: [
      { input: "temperatures = [73,74,75,71,69,72,76,73]", output: "[1,1,4,2,1,1,0,0]" },
      { input: "temperatures = [30,40,50,60]", output: "[1,1,1,0]" },
    ],
    constraints: ["1 <= temperatures.length <= 10^5", "30 <= temperatures[i] <= 100"],
    starterCode: {
      python: `class Solution:\n    def dailyTemperatures(self, temperatures):\n        pass`,
      javascript: `function dailyTemperatures(temperatures) {\n\n}`,
      java: `class Solution {\n    public int[] dailyTemperatures(int[] temperatures) {\n        return new int[]{};\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> dailyTemperatures(vector<int>& temperatures) {\n        return {};\n    }\n};`,
    },
    testcases: [
      { input: { temperatures: [73, 74, 75, 71, 69, 72, 76, 73] }, expectedOutput: [1, 1, 4, 2, 1, 1, 0, 0] },
      { input: { temperatures: [30, 40, 50, 60] }, expectedOutput: [1, 1, 1, 0] },
      { input: { temperatures: [30, 60, 90] }, expectedOutput: [1, 1, 0] },
    ],
    hiddentestcases: [
      { input: { temperatures: [89, 62, 70, 58, 47, 47, 46, 76, 100, 70] }, expectedOutput: [8, 1, 5, 4, 3, 2, 1, 1, 0, 0] },
    ],
  },

  // ── LINKED LIST ───────────────────────────────────────────────────────────

  {
    id: 22,
    title: "Reverse Linked List",
    slug: "reverse-linked-list",
    functionName: "reverseList",
    difficulty: "Easy",
    topic: "Linked List",
    pattern: "iteration / recursion",
    sourceType: "core",
    description:
      "Given the head of a singly linked list represented as an array, reverse the list and return the reversed array.\n\nFocus on the pointer-reversal logic: maintain prev, curr, and next pointers. At each step, reverse the direction of the pointer, then advance all three.",
    examples: [
      { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" },
      { input: "head = [1,2]", output: "[2,1]" },
      { input: "head = []", output: "[]" },
    ],
    constraints: ["0 <= number of nodes <= 5000", "-5000 <= Node.val <= 5000"],
    starterCode: {
      python: `class Solution:\n    def reverseList(self, head):\n        pass`,
      javascript: `function reverseList(head) {\n\n}`,
      java: `class Solution {\n    public int[] reverseList(int[] head) {\n        return new int[]{};\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> reverseList(vector<int>& head) {\n        return {};\n    }\n};`,
    },
    testcases: [
      { input: { head: [1, 2, 3, 4, 5] }, expectedOutput: [5, 4, 3, 2, 1] },
      { input: { head: [1, 2] }, expectedOutput: [2, 1] },
      { input: { head: [] }, expectedOutput: [] },
    ],
    hiddentestcases: [
      { input: { head: [1] }, expectedOutput: [1] },
      { input: { head: [3, 1, 4, 1, 5, 9, 2, 6] }, expectedOutput: [6, 2, 9, 5, 1, 4, 1, 3] },
    ],
  },

  {
    id: 23,
    title: "Merge Two Sorted Lists",
    slug: "merge-two-sorted-lists",
    functionName: "mergeTwoLists",
    difficulty: "Easy",
    topic: "Linked List",
    pattern: "two pointers",
    sourceType: "core",
    description:
      "You are given the heads of two sorted linked lists as sorted arrays list1 and list2. Merge the two lists into one sorted list and return it.\n\nThis is the classic merge step of merge sort. Use two pointers and always pick the smaller value.",
    examples: [
      { input: "list1 = [1,2,4], list2 = [1,3,4]", output: "[1,1,2,3,4,4]" },
      { input: "list1 = [], list2 = []", output: "[]" },
      { input: "list1 = [], list2 = [0]", output: "[0]" },
    ],
    constraints: ["0 <= number of nodes in each list <= 50", "-100 <= Node.val <= 100", "Both lists are sorted in non-decreasing order."],
    starterCode: {
      python: `class Solution:\n    def mergeTwoLists(self, list1, list2):\n        pass`,
      javascript: `function mergeTwoLists(list1, list2) {\n\n}`,
      java: `class Solution {\n    public int[] mergeTwoLists(int[] list1, int[] list2) {\n        return new int[]{};\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> mergeTwoLists(vector<int>& list1, vector<int>& list2) {\n        return {};\n    }\n};`,
    },
    testcases: [
      { input: { list1: [1, 2, 4], list2: [1, 3, 4] }, expectedOutput: [1, 1, 2, 3, 4, 4] },
      { input: { list1: [], list2: [] }, expectedOutput: [] },
      { input: { list1: [], list2: [0] }, expectedOutput: [0] },
    ],
    hiddentestcases: [
      { input: { list1: [1], list2: [2] }, expectedOutput: [1, 2] },
      { input: { list1: [1, 3, 5, 7], list2: [2, 4, 6, 8] }, expectedOutput: [1, 2, 3, 4, 5, 6, 7, 8] },
    ],
  },

  {
    id: 24,
    title: "Middle of the Linked List",
    slug: "middle-of-the-linked-list",
    functionName: "middleNode",
    difficulty: "Easy",
    topic: "Linked List",
    pattern: "fast / slow pointer",
    sourceType: "core",
    description:
      "Given an array representing a linked list, return the value at the middle node. If there are two middle nodes, return the second middle.\n\nThe classic approach: fast pointer moves 2 steps, slow pointer moves 1 step. When fast reaches the end, slow is at the middle.",
    examples: [
      { input: "head = [1,2,3,4,5]", output: "3", explanation: "Middle of [1,2,3,4,5] is 3." },
      { input: "head = [1,2,3,4,5,6]", output: "4", explanation: "Two middles are 3 and 4 — return the second." },
    ],
    constraints: ["1 <= number of nodes <= 100", "1 <= Node.val <= 100"],
    starterCode: {
      python: `class Solution:\n    def middleNode(self, head):\n        pass`,
      javascript: `function middleNode(head) {\n\n}`,
      java: `class Solution {\n    public int middleNode(int[] head) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int middleNode(vector<int>& head) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { head: [1, 2, 3, 4, 5] }, expectedOutput: 3 },
      { input: { head: [1, 2, 3, 4, 5, 6] }, expectedOutput: 4 },
      { input: { head: [1] }, expectedOutput: 1 },
    ],
    hiddentestcases: [
      { input: { head: [1, 2] }, expectedOutput: 2 },
      { input: { head: [10, 20, 30, 40] }, expectedOutput: 30 },
    ],
  },

  {
    id: 25,
    title: "Remove Nth Node From End",
    slug: "remove-nth-node-from-end",
    functionName: "removeNthFromEnd",
    difficulty: "Medium",
    topic: "Linked List",
    pattern: "fast / slow pointer",
    sourceType: "core",
    description:
      "Given an array representing a linked list and an integer n, remove the nth node from the end of the list and return the modified list.\n\nAdvance one pointer n steps ahead, then move both pointers together. When the fast pointer hits the end, the slow pointer is right before the node to remove.",
    examples: [
      { input: "head = [1,2,3,4,5], n = 2", output: "[1,2,3,5]" },
      { input: "head = [1], n = 1", output: "[]" },
      { input: "head = [1,2], n = 1", output: "[1]" },
    ],
    constraints: ["1 <= number of nodes <= 30", "0 <= Node.val <= 100", "1 <= n <= number of nodes"],
    starterCode: {
      python: `class Solution:\n    def removeNthFromEnd(self, head, n):\n        pass`,
      javascript: `function removeNthFromEnd(head, n) {\n\n}`,
      java: `class Solution {\n    public int[] removeNthFromEnd(int[] head, int n) {\n        return new int[]{};\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> removeNthFromEnd(vector<int>& head, int n) {\n        return {};\n    }\n};`,
    },
    testcases: [
      { input: { head: [1, 2, 3, 4, 5], n: 2 }, expectedOutput: [1, 2, 3, 5] },
      { input: { head: [1], n: 1 }, expectedOutput: [] },
      { input: { head: [1, 2], n: 1 }, expectedOutput: [1] },
    ],
    hiddentestcases: [
      { input: { head: [1, 2], n: 2 }, expectedOutput: [2] },
      { input: { head: [1, 2, 3, 4, 5], n: 5 }, expectedOutput: [2, 3, 4, 5] },
    ],
  },

  // ── TWO POINTERS ──────────────────────────────────────────────────────────

  {
    id: 11,
    title: "Container With Most Water",
    slug: "container-with-most-water",
    functionName: "maxArea",
    difficulty: "Medium",
    topic: "Two Pointers",
    pattern: "two pointers",
    sourceType: "core",
    description:
      "Given an integer array height of length n, find two lines that together with the x-axis form a container holding the most water. Return the maximum water volume. The two-pointer approach gives O(n) time.",
    examples: [
      { input: "height = [1,8,6,2,5,4,8,3,7]", output: "49" },
      { input: "height = [1,1]", output: "1" },
    ],
    constraints: ["n == height.length", "2 <= n <= 10^5", "0 <= height[i] <= 10^4"],
    starterCode: {
      python: `class Solution:\n    def maxArea(self, height):\n        pass`,
      javascript: `function maxArea(height) {\n\n}`,
      java: `class Solution {\n    public int maxArea(int[] height) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { height: [1, 8, 6, 2, 5, 4, 8, 3, 7] }, expectedOutput: 49 },
      { input: { height: [1, 1] }, expectedOutput: 1 },
      { input: { height: [4, 3, 2, 1, 4] }, expectedOutput: 16 },
    ],
    hiddentestcases: [
      { input: { height: [1, 2, 1] }, expectedOutput: 2 },
      { input: { height: [2, 3, 4, 5, 18, 17, 6] }, expectedOutput: 17 },
    ],
  },

  {
    id: 17,
    title: "Trapping Rain Water",
    slug: "trapping-rain-water",
    functionName: "trap",
    difficulty: "Hard",
    topic: "Two Pointers",
    pattern: "two pointers",
    sourceType: "core",
    description:
      "Given n non-negative integers representing an elevation map where each bar has width 1, compute how much water it can trap after raining. Classic two-pointer or stack problem.",
    examples: [
      { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6" },
      { input: "height = [4,2,0,3,2,5]", output: "9" },
    ],
    constraints: ["n == height.length", "1 <= n <= 2 * 10^4", "0 <= height[i] <= 10^5"],
    starterCode: {
      python: `class Solution:\n    def trap(self, height):\n        pass`,
      javascript: `function trap(height) {\n\n}`,
      java: `class Solution {\n    public int trap(int[] height) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int trap(vector<int>& height) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { height: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1] }, expectedOutput: 6 },
      { input: { height: [4, 2, 0, 3, 2, 5] }, expectedOutput: 9 },
      { input: { height: [3, 0, 2, 0, 4] }, expectedOutput: 7 },
    ],
    hiddentestcases: [
      { input: { height: [1, 0, 1] }, expectedOutput: 1 },
      { input: { height: [5, 4, 1, 2] }, expectedOutput: 1 },
    ],
  },

  {
    id: 31,
    title: "Two Sum II — Input Array Is Sorted",
    slug: "two-sum-ii-sorted",
    functionName: "twoSumSorted",
    difficulty: "Easy",
    topic: "Two Pointers",
    pattern: "two pointers",
    sourceType: "variant",
    description:
      "Given a 1-indexed sorted array of integers and a target, return the 1-indexed positions [index1, index2] of the two numbers that add up to target.\n\nBecause the array is sorted, use two pointers from both ends. If the sum is too large, move right pointer left. If too small, move left pointer right.",
    examples: [
      { input: "numbers = [2,7,11,15], target = 9", output: "[1,2]" },
      { input: "numbers = [2,3,4], target = 6", output: "[1,3]" },
      { input: "numbers = [-1,0], target = -1", output: "[1,2]" },
    ],
    constraints: ["2 <= numbers.length <= 3 * 10^4", "-1000 <= numbers[i] <= 1000", "numbers is sorted in non-decreasing order.", "Exactly one solution exists.", "Use O(1) extra space."],
    starterCode: {
      python: `class Solution:\n    def twoSumSorted(self, numbers, target):\n        pass`,
      javascript: `function twoSumSorted(numbers, target) {\n\n}`,
      java: `class Solution {\n    public int[] twoSumSorted(int[] numbers, int target) {\n        return new int[]{};\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> twoSumSorted(vector<int>& numbers, int target) {\n        return {};\n    }\n};`,
    },
    testcases: [
      { input: { numbers: [2, 7, 11, 15], target: 9 }, expectedOutput: [1, 2] },
      { input: { numbers: [2, 3, 4], target: 6 }, expectedOutput: [1, 3] },
      { input: { numbers: [-1, 0], target: -1 }, expectedOutput: [1, 2] },
    ],
    hiddentestcases: [
      { input: { numbers: [1, 2, 3, 4, 5], target: 9 }, expectedOutput: [4, 5] },
      { input: { numbers: [5, 25, 75], target: 100 }, expectedOutput: [2, 3] },
    ],
  },

  {
    id: 33,
    title: "3Sum",
    slug: "three-sum",
    functionName: "threeSum",
    difficulty: "Medium",
    topic: "Two Pointers",
    pattern: "sort + two pointers",
    sourceType: "core",
    description:
      "Given an integer array nums, return the count of unique triplets that sum to zero.\n\nSort the array first. For each element nums[i], use two pointers on the remaining subarray. Skip duplicates to avoid counting the same triplet twice.",
    examples: [
      { input: "nums = [-1,0,1,2,-1,-4]", output: "2", explanation: "Triplets [-1,-1,2] and [-1,0,1] sum to zero." },
      { input: "nums = [0,1,1]", output: "0" },
      { input: "nums = [0,0,0]", output: "1" },
    ],
    constraints: ["3 <= nums.length <= 3000", "-10^5 <= nums[i] <= 10^5"],
    starterCode: {
      python: `class Solution:\n    def threeSum(self, nums):\n        # return the count of unique triplets summing to 0\n        pass`,
      javascript: `function threeSum(nums) {\n  // return the count of unique triplets summing to 0\n}`,
      java: `class Solution {\n    public int threeSum(int[] nums) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int threeSum(vector<int>& nums) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { nums: [-1, 0, 1, 2, -1, -4] }, expectedOutput: 2 },
      { input: { nums: [0, 1, 1] }, expectedOutput: 0 },
      { input: { nums: [0, 0, 0] }, expectedOutput: 1 },
    ],
    hiddentestcases: [
      { input: { nums: [-2, 0, 1, 1, 2] }, expectedOutput: 2 },
      { input: { nums: [1, 2, -2, -1] }, expectedOutput: 0 },
    ],
  },

  // ── SLIDING WINDOW ────────────────────────────────────────────────────────

  {
    id: 9,
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating-characters",
    functionName: "lengthOfLongestSubstring",
    difficulty: "Medium",
    topic: "Sliding Window",
    pattern: "sliding window",
    sourceType: "core",
    description:
      "Given a string s, find the length of the longest substring without repeating characters. Use the sliding window technique for an O(n) solution.",
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: 'Longest substring is "abc".' },
      { input: 's = "bbbbb"', output: "1" },
      { input: 's = "pwwkew"', output: "3", explanation: '"wke" has length 3.' },
    ],
    constraints: ["0 <= s.length <= 5 * 10^4"],
    starterCode: {
      python: `class Solution:\n    def lengthOfLongestSubstring(self, s):\n        pass`,
      javascript: `function lengthOfLongestSubstring(s) {\n\n}`,
      java: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { s: "abcabcbb" }, expectedOutput: 3 },
      { input: { s: "bbbbb" }, expectedOutput: 1 },
      { input: { s: "pwwkew" }, expectedOutput: 3 },
    ],
    hiddentestcases: [
      { input: { s: "" }, expectedOutput: 0 },
      { input: { s: "dvdf" }, expectedOutput: 3 },
    ],
  },

  {
    id: 34,
    title: "Minimum Size Subarray Sum",
    slug: "minimum-size-subarray-sum",
    functionName: "minSubArrayLen",
    difficulty: "Medium",
    topic: "Sliding Window",
    pattern: "sliding window",
    sourceType: "core",
    description:
      "Given a target integer and an array of positive integers nums, return the minimal length of a contiguous subarray whose sum is >= target. If no such subarray exists, return 0.\n\nExpand the window by moving right. When the window sum meets the target, shrink from the left and record the minimum length.",
    examples: [
      { input: "target = 7, nums = [2,3,1,2,4,3]", output: "2", explanation: "Subarray [4,3] has sum >= 7." },
      { input: "target = 4, nums = [1,4,4]", output: "1" },
      { input: "target = 11, nums = [1,1,1,1,1,1,1,1]", output: "0" },
    ],
    constraints: ["1 <= target <= 10^9", "1 <= nums.length <= 10^5", "1 <= nums[i] <= 10^4"],
    starterCode: {
      python: `class Solution:\n    def minSubArrayLen(self, target, nums):\n        pass`,
      javascript: `function minSubArrayLen(target, nums) {\n\n}`,
      java: `class Solution {\n    public int minSubArrayLen(int target, int[] nums) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int minSubArrayLen(int target, vector<int>& nums) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { target: 7, nums: [2, 3, 1, 2, 4, 3] }, expectedOutput: 2 },
      { input: { target: 4, nums: [1, 4, 4] }, expectedOutput: 1 },
      { input: { target: 11, nums: [1, 1, 1, 1, 1, 1, 1, 1] }, expectedOutput: 0 },
    ],
    hiddentestcases: [
      { input: { target: 15, nums: [1, 2, 3, 4, 5] }, expectedOutput: 5 },
      { input: { target: 6, nums: [10, 2, 3] }, expectedOutput: 1 },
    ],
  },

  {
    id: 35,
    title: "Maximum Average Subarray",
    slug: "maximum-average-subarray",
    functionName: "findMaxAverage",
    difficulty: "Easy",
    topic: "Sliding Window",
    pattern: "fixed-size sliding window",
    sourceType: "variant",
    description:
      "Given an integer array nums and an integer k, find the contiguous subarray of length k with the maximum average value and return that maximum average.\n\nCompute the sum of the first k elements, then slide the window by adding the next element and removing the first.",
    examples: [
      { input: "nums = [1,12,-5,-6,50,3], k = 4", output: "12.75", explanation: "Max average subarray is [12,-5,-6,50] = 51/4 = 12.75." },
      { input: "nums = [5], k = 1", output: "5.0" },
    ],
    constraints: ["1 <= k <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    starterCode: {
      python: `class Solution:\n    def findMaxAverage(self, nums, k):\n        pass`,
      javascript: `function findMaxAverage(nums, k) {\n\n}`,
      java: `class Solution {\n    public double findMaxAverage(int[] nums, int k) {\n        return 0.0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    double findMaxAverage(vector<int>& nums, int k) {\n        return 0.0;\n    }\n};`,
    },
    testcases: [
      { input: { nums: [1, 12, -5, -6, 50, 3], k: 4 }, expectedOutput: 12.75 },
      { input: { nums: [5], k: 1 }, expectedOutput: 5.0 },
      { input: { nums: [0, 1, 1, 3, 3], k: 4 }, expectedOutput: 2.0 },
    ],
    hiddentestcases: [
      { input: { nums: [3, 3, 3, 3, 3], k: 3 }, expectedOutput: 3.0 },
      { input: { nums: [-1, -12, -5], k: 2 }, expectedOutput: -6.5 },
    ],
  },

  // ── BINARY SEARCH ─────────────────────────────────────────────────────────

  {
    id: 38,
    title: "Binary Search",
    slug: "binary-search",
    functionName: "search",
    difficulty: "Easy",
    topic: "Binary Search",
    pattern: "binary search",
    sourceType: "core",
    description:
      "Given a sorted array of integers and a target value, return the index of the target. If not found, return -1. Your algorithm must run in O(log n) time.\n\nMaintain left and right pointers. Check the midpoint each step — if it equals the target, return mid. If target is less, search left half. Otherwise search right half.",
    examples: [
      { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4" },
      { input: "nums = [-1,0,3,5,9,12], target = 2", output: "-1" },
    ],
    constraints: ["1 <= nums.length <= 10^4", "-10^4 < nums[i], target < 10^4", "All integers in nums are unique.", "nums is sorted in ascending order."],
    starterCode: {
      python: `class Solution:\n    def search(self, nums, target):\n        pass`,
      javascript: `function search(nums, target) {\n\n}`,
      java: `class Solution {\n    public int search(int[] nums, int target) {\n        return -1;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        return -1;\n    }\n};`,
    },
    testcases: [
      { input: { nums: [-1, 0, 3, 5, 9, 12], target: 9 }, expectedOutput: 4 },
      { input: { nums: [-1, 0, 3, 5, 9, 12], target: 2 }, expectedOutput: -1 },
      { input: { nums: [5], target: 5 }, expectedOutput: 0 },
    ],
    hiddentestcases: [
      { input: { nums: [1, 3, 5, 7, 9, 11], target: 7 }, expectedOutput: 3 },
      { input: { nums: [2, 4, 6, 8, 10], target: 1 }, expectedOutput: -1 },
    ],
  },

  {
    id: 14,
    title: "Find Minimum in Rotated Sorted Array",
    slug: "find-minimum-in-rotated-sorted-array",
    functionName: "findMin",
    difficulty: "Medium",
    topic: "Binary Search",
    pattern: "binary search",
    sourceType: "core",
    description:
      "A sorted array of unique integers was rotated between 1 and n times. Given the rotated array nums, return the minimum element. Your solution must run in O(log n) time.",
    examples: [
      { input: "nums = [3,4,5,1,2]", output: "1" },
      { input: "nums = [4,5,6,7,0,1,2]", output: "0" },
      { input: "nums = [11,13,15,17]", output: "11" },
    ],
    constraints: ["n == nums.length", "1 <= n <= 5000", "All integers are unique."],
    starterCode: {
      python: `class Solution:\n    def findMin(self, nums):\n        pass`,
      javascript: `function findMin(nums) {\n\n}`,
      java: `class Solution {\n    public int findMin(int[] nums) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int findMin(vector<int>& nums) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { nums: [3, 4, 5, 1, 2] }, expectedOutput: 1 },
      { input: { nums: [4, 5, 6, 7, 0, 1, 2] }, expectedOutput: 0 },
      { input: { nums: [11, 13, 15, 17] }, expectedOutput: 11 },
    ],
    hiddentestcases: [
      { input: { nums: [2, 1] }, expectedOutput: 1 },
      { input: { nums: [3, 1, 2] }, expectedOutput: 1 },
    ],
  },

  {
    id: 39,
    title: "Search in Rotated Sorted Array",
    slug: "search-in-rotated-sorted-array",
    functionName: "searchRotated",
    difficulty: "Medium",
    topic: "Binary Search",
    pattern: "binary search",
    sourceType: "core",
    description:
      "A sorted array was rotated at an unknown pivot. Given the rotated array and a target, return the index of the target or -1 if not found. Must run in O(log n).\n\nAt each binary search step, one half is always sorted. Determine which half the target falls in.",
    examples: [
      { input: "nums = [4,5,6,7,0,1,2], target = 0", output: "4" },
      { input: "nums = [4,5,6,7,0,1,2], target = 3", output: "-1" },
      { input: "nums = [1], target = 0", output: "-1" },
    ],
    constraints: ["1 <= nums.length <= 5000", "-10^4 <= nums[i] <= 10^4", "All values are unique.", "nums is sorted and rotated between 1 and n times."],
    starterCode: {
      python: `class Solution:\n    def searchRotated(self, nums, target):\n        pass`,
      javascript: `function searchRotated(nums, target) {\n\n}`,
      java: `class Solution {\n    public int searchRotated(int[] nums, int target) {\n        return -1;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int searchRotated(vector<int>& nums, int target) {\n        return -1;\n    }\n};`,
    },
    testcases: [
      { input: { nums: [4, 5, 6, 7, 0, 1, 2], target: 0 }, expectedOutput: 4 },
      { input: { nums: [4, 5, 6, 7, 0, 1, 2], target: 3 }, expectedOutput: -1 },
      { input: { nums: [1], target: 0 }, expectedOutput: -1 },
    ],
    hiddentestcases: [
      { input: { nums: [3, 1], target: 1 }, expectedOutput: 1 },
      { input: { nums: [5, 1, 3], target: 5 }, expectedOutput: 0 },
    ],
  },

  // ── HASH MAPS ─────────────────────────────────────────────────────────────

  {
    id: 10,
    title: "Valid Anagram",
    slug: "valid-anagram",
    functionName: "isAnagram",
    difficulty: "Easy",
    topic: "Hash Maps",
    pattern: "frequency count",
    sourceType: "core",
    description:
      "Given two strings s and t, return true if t is an anagram of s, and false otherwise. An anagram uses all original letters exactly once in a different arrangement.",
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: "true" },
      { input: 's = "rat", t = "car"', output: "false" },
    ],
    constraints: ["1 <= s.length, t.length <= 5 * 10^4", "s and t consist of lowercase English letters."],
    starterCode: {
      python: `class Solution:\n    def isAnagram(self, s, t):\n        pass`,
      javascript: `function isAnagram(s, t) {\n\n}`,
      java: `class Solution {\n    public boolean isAnagram(String s, String t) {\n        return false;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        return false;\n    }\n};`,
    },
    testcases: [
      { input: { s: "anagram", t: "nagaram" }, expectedOutput: true },
      { input: { s: "rat", t: "car" }, expectedOutput: false },
      { input: { s: "ab", t: "a" }, expectedOutput: false },
    ],
    hiddentestcases: [
      { input: { s: "listen", t: "silent" }, expectedOutput: true },
      { input: { s: "hello", t: "world" }, expectedOutput: false },
    ],
  },

  {
    id: 21,
    title: "Group Anagrams",
    slug: "group-anagrams",
    functionName: "groupAnagrams",
    difficulty: "Medium",
    topic: "Hash Maps",
    pattern: "frequency count",
    sourceType: "core",
    description:
      "Given an array of strings strs, group the anagrams together and return the number of groups.\n\nTwo strings are anagrams if they contain the same characters in the same frequency. Use a sorted version of each string (or a frequency tuple) as a hash map key. Each unique key is one anagram group.",
    examples: [
      { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: "3", explanation: 'Three groups: ["eat","tea","ate"], ["tan","nat"], ["bat"].' },
      { input: 'strs = [""]', output: "1" },
      { input: 'strs = ["a"]', output: "1" },
    ],
    constraints: ["1 <= strs.length <= 10^4", "0 <= strs[i].length <= 100", "strs[i] consists of lowercase English letters."],
    starterCode: {
      python: `class Solution:\n    def groupAnagrams(self, strs):\n        # return the number of anagram groups\n        pass`,
      javascript: `function groupAnagrams(strs) {\n  // return the number of anagram groups\n}`,
      java: `class Solution {\n    public int groupAnagrams(String[] strs) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int groupAnagrams(vector<string>& strs) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { strs: ["eat", "tea", "tan", "ate", "nat", "bat"] }, expectedOutput: 3 },
      { input: { strs: [""] }, expectedOutput: 1 },
      { input: { strs: ["a"] }, expectedOutput: 1 },
    ],
    hiddentestcases: [
      { input: { strs: ["abc", "bca", "cab", "xyz"] }, expectedOutput: 2 },
      { input: { strs: ["a", "b", "c"] }, expectedOutput: 3 },
    ],
  },

  // ── HASHING ───────────────────────────────────────────────────────────────

  {
    id: 49,
    title: "Longest Consecutive Sequence",
    slug: "longest-consecutive-sequence",
    functionName: "longestConsecutive",
    difficulty: "Medium",
    topic: "Hashing",
    pattern: "hash set",
    sourceType: "core",
    description:
      "Given an unsorted array of integers, return the length of the longest consecutive elements sequence. Must run in O(n) time.\n\nAdd all numbers to a hash set. For each number, only start counting if it's the beginning of a sequence (num - 1 is NOT in the set). Then count upward.",
    examples: [
      { input: "nums = [100,4,200,1,3,2]", output: "4", explanation: "Longest consecutive sequence is [1,2,3,4]." },
      { input: "nums = [0,3,7,2,5,8,4,6,0,1]", output: "9" },
    ],
    constraints: ["0 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
    starterCode: {
      python: `class Solution:\n    def longestConsecutive(self, nums):\n        pass`,
      javascript: `function longestConsecutive(nums) {\n\n}`,
      java: `class Solution {\n    public int longestConsecutive(int[] nums) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int longestConsecutive(vector<int>& nums) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { nums: [100, 4, 200, 1, 3, 2] }, expectedOutput: 4 },
      { input: { nums: [0, 3, 7, 2, 5, 8, 4, 6, 0, 1] }, expectedOutput: 9 },
      { input: { nums: [] }, expectedOutput: 0 },
    ],
    hiddentestcases: [
      { input: { nums: [1, 2, 3, 4, 5] }, expectedOutput: 5 },
      { input: { nums: [9, 1, 4, 7, 3, -1, 0, 5, 8, -1, 6] }, expectedOutput: 7 },
    ],
  },

  {
    id: 50,
    title: "Two Sum — Count Pairs",
    slug: "two-sum-count-pairs",
    functionName: "countPairs",
    difficulty: "Easy",
    topic: "Hashing",
    pattern: "hash map complement",
    sourceType: "original",
    description:
      "Given an array of integers nums and a target, return the number of unique index pairs (i, j) where i < j and nums[i] + nums[j] == target.\n\nThis is a Code Club original. Instead of returning the first pair, count all of them. Use a hash map tracking counts of seen values — for each number, check if (target - number) has been seen and add its count to the result.",
    examples: [
      { input: "nums = [1,5,3,3,3], target = 6", output: "4", explanation: "Pairs at indices (0,1), (2,3), (2,4), (3,4)." },
      { input: "nums = [1,2,3,4,5], target = 6", output: "2" },
      { input: "nums = [1,1,1], target = 2", output: "3" },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
    starterCode: {
      python: `class Solution:\n    def countPairs(self, nums, target):\n        pass`,
      javascript: `function countPairs(nums, target) {\n\n}`,
      java: `class Solution {\n    public int countPairs(int[] nums, int target) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int countPairs(vector<int>& nums, int target) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { nums: [1, 5, 3, 3, 3], target: 6 }, expectedOutput: 4 },
      { input: { nums: [1, 2, 3, 4, 5], target: 6 }, expectedOutput: 2 },
      { input: { nums: [1, 1, 1], target: 2 }, expectedOutput: 3 },
    ],
    hiddentestcases: [
      { input: { nums: [0, 0, 0, 0], target: 0 }, expectedOutput: 6 },
      { input: { nums: [5, 5, 5, 5, 5], target: 10 }, expectedOutput: 10 },
    ],
  },

  // ── STRINGS ───────────────────────────────────────────────────────────────

  {
    id: 16,
    title: "Longest Common Prefix",
    slug: "longest-common-prefix",
    functionName: "longestCommonPrefix",
    difficulty: "Easy",
    topic: "Strings",
    pattern: "vertical scanning",
    sourceType: "core",
    description:
      "Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string.",
    examples: [
      { input: 'strs = ["flower","flow","flight"]', output: '"fl"' },
      { input: 'strs = ["dog","racecar","car"]', output: '""', explanation: "No common prefix." },
    ],
    constraints: ["1 <= strs.length <= 200", "0 <= strs[i].length <= 200"],
    starterCode: {
      python: `class Solution:\n    def longestCommonPrefix(self, strs):\n        pass`,
      javascript: `function longestCommonPrefix(strs) {\n\n}`,
      java: `class Solution {\n    public String longestCommonPrefix(String[] strs) {\n        return "";\n    }\n}`,
      cpp: `class Solution {\npublic:\n    string longestCommonPrefix(vector<string>& strs) {\n        return "";\n    }\n};`,
    },
    testcases: [
      { input: { strs: ["flower", "flow", "flight"] }, expectedOutput: "fl" },
      { input: { strs: ["dog", "racecar", "car"] }, expectedOutput: "" },
      { input: { strs: ["interview", "inter", "interest"] }, expectedOutput: "inter" },
    ],
    hiddentestcases: [
      { input: { strs: ["a"] }, expectedOutput: "a" },
      { input: { strs: ["abc", "abc", "abc"] }, expectedOutput: "abc" },
    ],
  },

  {
    id: 47,
    title: "Reverse String",
    slug: "reverse-string",
    functionName: "reverseString",
    difficulty: "Easy",
    topic: "Strings",
    pattern: "two pointers",
    sourceType: "core",
    description:
      "Given a string s, reverse it and return the reversed string. Do it with O(1) extra memory — use two pointers, one from each end, and swap until they meet.",
    examples: [
      { input: 's = "hello"', output: '"olleh"' },
      { input: 's = "Hannah"', output: '"hannaH"' },
    ],
    constraints: ["1 <= s.length <= 10^5"],
    starterCode: {
      python: `class Solution:\n    def reverseString(self, s):\n        pass`,
      javascript: `function reverseString(s) {\n\n}`,
      java: `class Solution {\n    public String reverseString(String s) {\n        return "";\n    }\n}`,
      cpp: `class Solution {\npublic:\n    string reverseString(string s) {\n        return "";\n    }\n};`,
    },
    testcases: [
      { input: { s: "hello" }, expectedOutput: "olleh" },
      { input: { s: "Hannah" }, expectedOutput: "hannaH" },
      { input: { s: "a" }, expectedOutput: "a" },
    ],
    hiddentestcases: [
      { input: { s: "abcde" }, expectedOutput: "edcba" },
      { input: { s: "racecar" }, expectedOutput: "racecar" },
    ],
  },

  {
    id: 48,
    title: "Is Palindrome",
    slug: "is-palindrome",
    functionName: "isPalindrome",
    difficulty: "Easy",
    topic: "Strings",
    pattern: "two pointers",
    sourceType: "original",
    description:
      "A phrase is a palindrome if, after converting all uppercase letters to lowercase and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nGiven a string s, return true if it is a palindrome. Use two pointers — skip non-alphanumeric characters and compare from both ends.",
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', output: "true" },
      { input: 's = "race a car"', output: "false" },
      { input: 's = " "', output: "true" },
    ],
    constraints: ["1 <= s.length <= 2 * 10^5"],
    starterCode: {
      python: `class Solution:\n    def isPalindrome(self, s):\n        pass`,
      javascript: `function isPalindrome(s) {\n\n}`,
      java: `class Solution {\n    public boolean isPalindrome(String s) {\n        return false;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    bool isPalindrome(string s) {\n        return false;\n    }\n};`,
    },
    testcases: [
      { input: { s: "A man, a plan, a canal: Panama" }, expectedOutput: true },
      { input: { s: "race a car" }, expectedOutput: false },
      { input: { s: " " }, expectedOutput: true },
    ],
    hiddentestcases: [
      { input: { s: "Was it a car or a cat I saw?" }, expectedOutput: true },
      { input: { s: "hello" }, expectedOutput: false },
    ],
  },

  // ── DYNAMIC PROGRAMMING ───────────────────────────────────────────────────

  {
    id: 6,
    title: "Climbing Stairs",
    slug: "climbing-stairs",
    functionName: "climbStairs",
    difficulty: "Easy",
    topic: "Dynamic Programming",
    pattern: "1d dp / fibonacci",
    sourceType: "core",
    description:
      "You are climbing a staircase that takes n steps to reach the top. Each time you can climb 1 or 2 steps. In how many distinct ways can you reach the top?",
    examples: [
      { input: "n = 2", output: "2", explanation: "Two ways: (1+1) or (2)." },
      { input: "n = 3", output: "3", explanation: "Three ways: (1+1+1), (1+2), (2+1)." },
    ],
    constraints: ["1 <= n <= 45"],
    starterCode: {
      python: `class Solution:\n    def climbStairs(self, n):\n        pass`,
      javascript: `function climbStairs(n) {\n\n}`,
      java: `class Solution {\n    public int climbStairs(int n) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int climbStairs(int n) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { n: 2 }, expectedOutput: 2 },
      { input: { n: 3 }, expectedOutput: 3 },
      { input: { n: 5 }, expectedOutput: 8 },
    ],
    hiddentestcases: [
      { input: { n: 1 }, expectedOutput: 1 },
      { input: { n: 10 }, expectedOutput: 89 },
    ],
  },

  {
    id: 8,
    title: "Fibonacci Number",
    slug: "fibonacci-number",
    functionName: "fib",
    difficulty: "Easy",
    topic: "Dynamic Programming",
    pattern: "1d dp / memoization",
    sourceType: "core",
    description:
      "The Fibonacci sequence: F(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2). Given n, calculate F(n). Try both recursive and iterative approaches.",
    examples: [
      { input: "n = 2", output: "1", explanation: "F(2) = F(1) + F(0) = 1." },
      { input: "n = 3", output: "2" },
      { input: "n = 4", output: "3" },
    ],
    constraints: ["0 <= n <= 30"],
    starterCode: {
      python: `class Solution:\n    def fib(self, n):\n        pass`,
      javascript: `function fib(n) {\n\n}`,
      java: `class Solution {\n    public int fib(int n) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int fib(int n) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { n: 2 }, expectedOutput: 1 },
      { input: { n: 3 }, expectedOutput: 2 },
      { input: { n: 4 }, expectedOutput: 3 },
    ],
    hiddentestcases: [
      { input: { n: 0 }, expectedOutput: 0 },
      { input: { n: 10 }, expectedOutput: 55 },
    ],
  },

  {
    id: 12,
    title: "House Robber",
    slug: "house-robber",
    functionName: "rob",
    difficulty: "Medium",
    topic: "Dynamic Programming",
    pattern: "1d dp",
    sourceType: "core",
    description:
      "You are a robber planning to rob houses along a street. Adjacent houses have connected alarms. Given an integer array nums representing money in each house, return the maximum amount you can rob without alerting police.",
    examples: [
      { input: "nums = [1,2,3,1]", output: "4", explanation: "Rob houses 1 and 3. Total = 4." },
      { input: "nums = [2,7,9,3,1]", output: "12" },
    ],
    constraints: ["1 <= nums.length <= 100", "0 <= nums[i] <= 400"],
    starterCode: {
      python: `class Solution:\n    def rob(self, nums):\n        pass`,
      javascript: `function rob(nums) {\n\n}`,
      java: `class Solution {\n    public int rob(int[] nums) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int rob(vector<int>& nums) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { nums: [1, 2, 3, 1] }, expectedOutput: 4 },
      { input: { nums: [2, 7, 9, 3, 1] }, expectedOutput: 12 },
      { input: { nums: [1, 2] }, expectedOutput: 2 },
    ],
    hiddentestcases: [
      { input: { nums: [2, 1, 1, 2] }, expectedOutput: 4 },
      { input: { nums: [10] }, expectedOutput: 10 },
    ],
  },

  {
    id: 13,
    title: "Coin Change",
    slug: "coin-change",
    functionName: "coinChange",
    difficulty: "Medium",
    topic: "Dynamic Programming",
    pattern: "unbounded knapsack",
    sourceType: "core",
    description:
      "You are given coins of different denominations and a total amount. Return the fewest coins needed to make the amount. If it cannot be made, return -1. You have an infinite number of each coin denomination.",
    examples: [
      { input: "coins = [1,5,11], amount = 15", output: "3" },
      { input: "coins = [2], amount = 3", output: "-1" },
      { input: "coins = [1], amount = 0", output: "0" },
    ],
    constraints: ["1 <= coins.length <= 12", "1 <= coins[i] <= 2^31 - 1", "0 <= amount <= 10^4"],
    starterCode: {
      python: `class Solution:\n    def coinChange(self, coins, amount):\n        pass`,
      javascript: `function coinChange(coins, amount) {\n\n}`,
      java: `class Solution {\n    public int coinChange(int[] coins, int amount) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { coins: [1, 5, 11], amount: 15 }, expectedOutput: 3 },
      { input: { coins: [2], amount: 3 }, expectedOutput: -1 },
      { input: { coins: [1, 2, 5], amount: 11 }, expectedOutput: 3 },
    ],
    hiddentestcases: [
      { input: { coins: [1], amount: 2 }, expectedOutput: 2 },
      { input: { coins: [2, 5, 10], amount: 27 }, expectedOutput: 4 },
    ],
  },

  {
    id: 18,
    title: "Word Break",
    slug: "word-break",
    functionName: "wordBreak",
    difficulty: "Hard",
    topic: "Dynamic Programming",
    pattern: "1d dp / memoization",
    sourceType: "core",
    description:
      "Given a string s and a dictionary wordDict, return true if s can be segmented into space-separated dictionary words. The same word may be reused multiple times.",
    examples: [
      { input: 's = "leetcode", wordDict = ["leet","code"]', output: "true" },
      { input: 's = "applepenapple", wordDict = ["apple","pen"]', output: "true" },
      { input: 's = "catsandog", wordDict = ["cats","dog","sand","and","cat"]', output: "false" },
    ],
    constraints: ["1 <= s.length <= 300", "s and wordDict[i] consist of lowercase English letters."],
    starterCode: {
      python: `class Solution:\n    def wordBreak(self, s, wordDict):\n        pass`,
      javascript: `function wordBreak(s, wordDict) {\n\n}`,
      java: `class Solution {\n    public boolean wordBreak(String s, java.util.List<String> wordDict) {\n        return false;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    bool wordBreak(string s, vector<string>& wordDict) {\n        return false;\n    }\n};`,
    },
    testcases: [
      { input: { s: "leetcode", wordDict: ["leet", "code"] }, expectedOutput: true },
      { input: { s: "applepenapple", wordDict: ["apple", "pen"] }, expectedOutput: true },
      { input: { s: "catsandog", wordDict: ["cats", "dog", "sand", "and", "cat"] }, expectedOutput: false },
    ],
    hiddentestcases: [
      { input: { s: "ab", wordDict: ["a", "b"] }, expectedOutput: true },
      { input: { s: "aaaaaaa", wordDict: ["aaaa", "aaa"] }, expectedOutput: true },
    ],
  },

  {
    id: 19,
    title: "Decode Ways",
    slug: "decode-ways",
    functionName: "numDecodings",
    difficulty: "Hard",
    topic: "Dynamic Programming",
    pattern: "1d dp",
    sourceType: "core",
    description:
      'A message can be encoded: "A"→"1", "B"→"2", ..., "Z"→"26". Given a string s of digits, return the number of ways to decode it. Note that "06" is invalid.',
    examples: [
      { input: 's = "12"', output: "2", explanation: '"AB" (1,2) or "L" (12).' },
      { input: 's = "226"', output: "3" },
      { input: 's = "06"', output: "0" },
    ],
    constraints: ["1 <= s.length <= 100", "s contains only digits."],
    starterCode: {
      python: `class Solution:\n    def numDecodings(self, s):\n        pass`,
      javascript: `function numDecodings(s) {\n\n}`,
      java: `class Solution {\n    public int numDecodings(String s) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int numDecodings(string s) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { s: "12" }, expectedOutput: 2 },
      { input: { s: "226" }, expectedOutput: 3 },
      { input: { s: "06" }, expectedOutput: 0 },
    ],
    hiddentestcases: [
      { input: { s: "1" }, expectedOutput: 1 },
      { input: { s: "11106" }, expectedOutput: 2 },
    ],
  },

  // ── GREEDY ────────────────────────────────────────────────────────────────

  {
    id: 20,
    title: "Jump Game II",
    slug: "jump-game-ii",
    functionName: "jump",
    difficulty: "Hard",
    topic: "Greedy",
    pattern: "greedy bfs",
    sourceType: "core",
    description:
      "You are at index 0 of an integer array nums. nums[i] is the maximum forward jump length from index i. Return the minimum number of jumps to reach the last index. A greedy BFS approach gives O(n) time.",
    examples: [
      { input: "nums = [2,3,1,1,4]", output: "2" },
      { input: "nums = [2,3,0,1,4]", output: "2" },
    ],
    constraints: ["1 <= nums.length <= 10^4", "0 <= nums[i] <= 1000", "The answer always exists."],
    starterCode: {
      python: `class Solution:\n    def jump(self, nums):\n        pass`,
      javascript: `function jump(nums) {\n\n}`,
      java: `class Solution {\n    public int jump(int[] nums) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int jump(vector<int>& nums) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { nums: [2, 3, 1, 1, 4] }, expectedOutput: 2 },
      { input: { nums: [2, 3, 0, 1, 4] }, expectedOutput: 2 },
      { input: { nums: [1, 2, 3] }, expectedOutput: 2 },
    ],
    hiddentestcases: [
      { input: { nums: [1] }, expectedOutput: 0 },
      { input: { nums: [1, 1, 1, 1] }, expectedOutput: 3 },
    ],
  },

  // ── HEAP ──────────────────────────────────────────────────────────────────

  {
    id: 40,
    title: "Kth Largest Element in Array",
    slug: "kth-largest-element",
    functionName: "findKthLargest",
    difficulty: "Medium",
    topic: "Heap",
    pattern: "min-heap of size k",
    sourceType: "core",
    description:
      "Given an integer array nums and an integer k, return the kth largest element. Maintain a min-heap of size k — for each element, push it in, and if the heap exceeds k, pop the smallest. The heap top is the answer.",
    examples: [
      { input: "nums = [3,2,1,5,6,4], k = 2", output: "5" },
      { input: "nums = [3,2,3,1,2,4,5,5,6], k = 4", output: "4" },
    ],
    constraints: ["1 <= k <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    starterCode: {
      python: `class Solution:\n    def findKthLargest(self, nums, k):\n        pass`,
      javascript: `function findKthLargest(nums, k) {\n\n}`,
      java: `class Solution {\n    public int findKthLargest(int[] nums, int k) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int findKthLargest(vector<int>& nums, int k) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { nums: [3, 2, 1, 5, 6, 4], k: 2 }, expectedOutput: 5 },
      { input: { nums: [3, 2, 3, 1, 2, 4, 5, 5, 6], k: 4 }, expectedOutput: 4 },
      { input: { nums: [1], k: 1 }, expectedOutput: 1 },
    ],
    hiddentestcases: [
      { input: { nums: [5, 2, 4, 1, 3, 6, 0], k: 3 }, expectedOutput: 4 },
      { input: { nums: [7, 6, 5, 4, 3, 2, 1], k: 5 }, expectedOutput: 3 },
    ],
  },

  {
    id: 41,
    title: "Last Stone Weight",
    slug: "last-stone-weight",
    functionName: "lastStoneWeight",
    difficulty: "Easy",
    topic: "Heap",
    pattern: "max-heap",
    sourceType: "variant",
    description:
      "Each turn, smash the two heaviest stones. If equal, both destroyed. If not, the smaller is destroyed and the larger becomes (larger - smaller). Return the weight of the last stone, or 0 if none remain.\n\nA max-heap efficiently gives you the two heaviest stones each turn.",
    examples: [
      { input: "stones = [2,7,4,1,8,1]", output: "1" },
      { input: "stones = [1]", output: "1" },
    ],
    constraints: ["1 <= stones.length <= 30", "1 <= stones[i] <= 1000"],
    starterCode: {
      python: `class Solution:\n    def lastStoneWeight(self, stones):\n        pass`,
      javascript: `function lastStoneWeight(stones) {\n\n}`,
      java: `class Solution {\n    public int lastStoneWeight(int[] stones) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int lastStoneWeight(vector<int>& stones) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { stones: [2, 7, 4, 1, 8, 1] }, expectedOutput: 1 },
      { input: { stones: [1] }, expectedOutput: 1 },
      { input: { stones: [3, 3] }, expectedOutput: 0 },
    ],
    hiddentestcases: [
      { input: { stones: [10, 4, 2, 10] }, expectedOutput: 2 },
      { input: { stones: [1, 1, 1, 1] }, expectedOutput: 0 },
    ],
  },

  // ── BACKTRACKING ──────────────────────────────────────────────────────────

  {
    id: 42,
    title: "Subsets",
    slug: "subsets",
    functionName: "subsets",
    difficulty: "Medium",
    topic: "Backtracking",
    pattern: "backtracking",
    sourceType: "core",
    description:
      "Given an integer array nums of unique elements, return the total number of subsets (the power set). The power set of n elements has 2^n subsets.\n\nAt each step, decide to include or exclude the current element. You can also solve this with bit manipulation: iterate from 0 to 2^n - 1.",
    examples: [
      { input: "nums = [1,2,3]", output: "8", explanation: "Subsets: [], [1], [2], [3], [1,2], [1,3], [2,3], [1,2,3]." },
      { input: "nums = [0]", output: "2" },
    ],
    constraints: ["1 <= nums.length <= 10", "-10 <= nums[i] <= 10", "All elements are unique."],
    starterCode: {
      python: `class Solution:\n    def subsets(self, nums):\n        # return the count of all subsets\n        pass`,
      javascript: `function subsets(nums) {\n  // return the count of all subsets\n}`,
      java: `class Solution {\n    public int subsets(int[] nums) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int subsets(vector<int>& nums) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { nums: [1, 2, 3] }, expectedOutput: 8 },
      { input: { nums: [0] }, expectedOutput: 2 },
      { input: { nums: [1, 2] }, expectedOutput: 4 },
    ],
    hiddentestcases: [
      { input: { nums: [1, 2, 3, 4] }, expectedOutput: 16 },
      { input: { nums: [5] }, expectedOutput: 2 },
    ],
  },

  {
    id: 43,
    title: "Combination Sum",
    slug: "combination-sum",
    functionName: "combinationSum",
    difficulty: "Medium",
    topic: "Backtracking",
    pattern: "backtracking",
    sourceType: "core",
    description:
      "Given an array of distinct positive integers candidates and a target, return the number of unique combinations where chosen numbers sum to target. The same number may be chosen unlimited times.\n\nBacktrack: include the current candidate (reusable) or move to the next. Stop when remaining target is 0 (count it) or goes negative (prune).",
    examples: [
      { input: "candidates = [2,3,6,7], target = 7", output: "2", explanation: "[2,2,3] and [7]." },
      { input: "candidates = [2,3,5], target = 8", output: "3" },
      { input: "candidates = [2], target = 1", output: "0" },
    ],
    constraints: ["1 <= candidates.length <= 30", "1 <= candidates[i] <= 200", "All elements are distinct.", "1 <= target <= 500"],
    starterCode: {
      python: `class Solution:\n    def combinationSum(self, candidates, target):\n        # return the count of unique combinations\n        pass`,
      javascript: `function combinationSum(candidates, target) {\n  // return the count of unique combinations\n}`,
      java: `class Solution {\n    public int combinationSum(int[] candidates, int target) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int combinationSum(vector<int>& candidates, int target) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { candidates: [2, 3, 6, 7], target: 7 }, expectedOutput: 2 },
      { input: { candidates: [2, 3, 5], target: 8 }, expectedOutput: 3 },
      { input: { candidates: [2], target: 1 }, expectedOutput: 0 },
    ],
    hiddentestcases: [
      { input: { candidates: [3, 5, 7], target: 12 }, expectedOutput: 2 },
      { input: { candidates: [1, 2], target: 4 }, expectedOutput: 4 },
    ],
  },

  {
    id: 44,
    title: "Letter Case Permutations",
    slug: "letter-case-permutations",
    functionName: "letterCasePermutation",
    difficulty: "Medium",
    topic: "Backtracking",
    pattern: "backtracking",
    sourceType: "original",
    description:
      "Given a string s, return the total number of unique strings you can generate by transforming every letter to be lowercase or uppercase. Digits stay as-is.\n\nThis is a Code Club original. The total count is 2 raised to the power of the number of letters in the string.",
    examples: [
      { input: 's = "a1b2"', output: "4", explanation: '"a1b2", "a1B2", "A1b2", "A1B2".' },
      { input: 's = "3z4"', output: "2" },
      { input: 's = "12345"', output: "1" },
    ],
    constraints: ["1 <= s.length <= 12"],
    starterCode: {
      python: `class Solution:\n    def letterCasePermutation(self, s):\n        # return the count of unique case permutations\n        pass`,
      javascript: `function letterCasePermutation(s) {\n  // return the count of unique case permutations\n}`,
      java: `class Solution {\n    public int letterCasePermutation(String s) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int letterCasePermutation(string s) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { s: "a1b2" }, expectedOutput: 4 },
      { input: { s: "3z4" }, expectedOutput: 2 },
      { input: { s: "12345" }, expectedOutput: 1 },
    ],
    hiddentestcases: [
      { input: { s: "abc" }, expectedOutput: 8 },
      { input: { s: "C" }, expectedOutput: 2 },
    ],
  },

  // ── TREES ─────────────────────────────────────────────────────────────────

  {
    id: 26,
    title: "Maximum Depth of Binary Tree",
    slug: "maximum-depth-of-binary-tree",
    functionName: "maxDepth",
    difficulty: "Easy",
    topic: "Trees",
    pattern: "dfs",
    sourceType: "core",
    description:
      "Given a binary tree as a level-order array (where -1 means null), return its maximum depth — the number of nodes along the longest path from root to leaf.\n\nExample: [3,9,20,-1,-1,15,7] has root 3, left child 9, right child 20, and 20's children are 15 and 7.",
    examples: [
      { input: "root = [3,9,20,-1,-1,15,7]", output: "3" },
      { input: "root = [1,-1,2]", output: "2" },
      { input: "root = []", output: "0" },
    ],
    constraints: ["0 <= number of nodes <= 10^4", "-100 <= Node.val <= 100"],
    starterCode: {
      python: `class Solution:\n    def maxDepth(self, root):\n        # root is a level-order list, -1 = null node\n        pass`,
      javascript: `function maxDepth(root) {\n  // root is a level-order array, -1 = null node\n}`,
      java: `class Solution {\n    public int maxDepth(int[] root) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int maxDepth(vector<int>& root) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { root: [3, 9, 20, -1, -1, 15, 7] }, expectedOutput: 3 },
      { input: { root: [1, -1, 2] }, expectedOutput: 2 },
      { input: { root: [] }, expectedOutput: 0 },
    ],
    hiddentestcases: [
      { input: { root: [1] }, expectedOutput: 1 },
      { input: { root: [1, 2, 3, 4, 5] }, expectedOutput: 3 },
    ],
  },

  {
    id: 27,
    title: "Invert Binary Tree",
    slug: "invert-binary-tree",
    functionName: "invertTree",
    difficulty: "Easy",
    topic: "Trees",
    pattern: "dfs",
    sourceType: "core",
    description:
      "Given a binary tree as a level-order array, invert the tree (mirror it left-to-right) and return the level-order array of the inverted tree. Recursively swap left and right children at every node.",
    examples: [
      { input: "root = [4,2,7,1,3,6,9]", output: "[4,7,2,9,6,3,1]" },
      { input: "root = [2,1,3]", output: "[2,3,1]" },
      { input: "root = []", output: "[]" },
    ],
    constraints: ["0 <= number of nodes <= 100", "-100 <= Node.val <= 100"],
    starterCode: {
      python: `class Solution:\n    def invertTree(self, root):\n        # root is a level-order list, -1 = null\n        # return the inverted level-order list\n        pass`,
      javascript: `function invertTree(root) {\n  // root is a level-order array, -1 = null\n  // return the inverted level-order array\n}`,
      java: `class Solution {\n    public int[] invertTree(int[] root) {\n        return new int[]{};\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> invertTree(vector<int>& root) {\n        return {};\n    }\n};`,
    },
    testcases: [
      { input: { root: [4, 2, 7, 1, 3, 6, 9] }, expectedOutput: [4, 7, 2, 9, 6, 3, 1] },
      { input: { root: [2, 1, 3] }, expectedOutput: [2, 3, 1] },
      { input: { root: [] }, expectedOutput: [] },
    ],
    hiddentestcases: [
      { input: { root: [1] }, expectedOutput: [1] },
      { input: { root: [1, 2, -1] }, expectedOutput: [1, -1, 2] },
    ],
  },

  {
    id: 28,
    title: "Diameter of Binary Tree",
    slug: "diameter-of-binary-tree",
    functionName: "diameterOfBinaryTree",
    difficulty: "Easy",
    topic: "Trees",
    pattern: "dfs",
    sourceType: "core",
    description:
      "Given a binary tree as a level-order array, return the length of the tree's diameter — the longest path between any two nodes.\n\nAt each node, the longest path through it = left depth + right depth. Track the maximum as you recurse.",
    examples: [
      { input: "root = [1,2,3,4,5]", output: "3", explanation: "Longest path is [4,2,1,3] — length 3." },
      { input: "root = [1,2]", output: "1" },
    ],
    constraints: ["1 <= number of nodes <= 10^4", "-100 <= Node.val <= 100"],
    starterCode: {
      python: `class Solution:\n    def diameterOfBinaryTree(self, root):\n        # root is a level-order list, -1 = null\n        pass`,
      javascript: `function diameterOfBinaryTree(root) {\n  // root is a level-order array, -1 = null\n}`,
      java: `class Solution {\n    public int diameterOfBinaryTree(int[] root) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int diameterOfBinaryTree(vector<int>& root) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { root: [1, 2, 3, 4, 5] }, expectedOutput: 3 },
      { input: { root: [1, 2] }, expectedOutput: 1 },
      { input: { root: [1] }, expectedOutput: 0 },
    ],
    hiddentestcases: [
      { input: { root: [1, 2, 3, 4, 5, -1, -1, 6] }, expectedOutput: 4 },
      { input: { root: [1, -1, 2, -1, -1, -1, 3] }, expectedOutput: 2 },
    ],
  },

  {
    id: 29,
    title: "Validate Binary Search Tree",
    slug: "validate-binary-search-tree",
    functionName: "isValidBST",
    difficulty: "Medium",
    topic: "Trees",
    pattern: "dfs with bounds",
    sourceType: "core",
    description:
      "Given a binary tree as a level-order array, determine if it is a valid BST.\n\nKey insight: pass min/max bounds down the recursion — don't just compare parent and child. Every node in the left subtree must be less than all ancestors, not just its parent.",
    examples: [
      { input: "root = [2,1,3]", output: "true" },
      { input: "root = [5,1,4,-1,-1,3,6]", output: "false" },
    ],
    constraints: ["1 <= number of nodes <= 10^4", "-2^31 <= Node.val <= 2^31 - 1"],
    starterCode: {
      python: `class Solution:\n    def isValidBST(self, root):\n        # root is a level-order list, -1 = null\n        pass`,
      javascript: `function isValidBST(root) {\n  // root is a level-order array, -1 = null\n}`,
      java: `class Solution {\n    public boolean isValidBST(int[] root) {\n        return false;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    bool isValidBST(vector<int>& root) {\n        return false;\n    }\n};`,
    },
    testcases: [
      { input: { root: [2, 1, 3] }, expectedOutput: true },
      { input: { root: [5, 1, 4, -1, -1, 3, 6] }, expectedOutput: false },
      { input: { root: [1] }, expectedOutput: true },
    ],
    hiddentestcases: [
      { input: { root: [5, 4, 6, -1, -1, 3, 7] }, expectedOutput: false },
      { input: { root: [10, 5, 15, -1, -1, 12, 20] }, expectedOutput: true },
    ],
  },

  {
    id: 30,
    title: "Same Tree",
    slug: "same-tree",
    functionName: "isSameTree",
    difficulty: "Easy",
    topic: "Trees",
    pattern: "dfs",
    sourceType: "variant",
    description:
      "Given two binary trees as level-order arrays p and q, check whether they are structurally identical with the same node values.\n\nRecurse through both simultaneously: if both null — equal. If one null — not equal. If values differ — not equal.",
    examples: [
      { input: "p = [1,2,3], q = [1,2,3]", output: "true" },
      { input: "p = [1,2], q = [1,-1,2]", output: "false" },
      { input: "p = [1,2,1], q = [1,1,2]", output: "false" },
    ],
    constraints: ["0 <= number of nodes <= 100", "-10^4 <= Node.val <= 10^4"],
    starterCode: {
      python: `class Solution:\n    def isSameTree(self, p, q):\n        # p and q are level-order lists, -1 = null\n        pass`,
      javascript: `function isSameTree(p, q) {\n  // p and q are level-order arrays, -1 = null\n}`,
      java: `class Solution {\n    public boolean isSameTree(int[] p, int[] q) {\n        return false;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    bool isSameTree(vector<int>& p, vector<int>& q) {\n        return false;\n    }\n};`,
    },
    testcases: [
      { input: { p: [1, 2, 3], q: [1, 2, 3] }, expectedOutput: true },
      { input: { p: [1, 2], q: [1, -1, 2] }, expectedOutput: false },
      { input: { p: [1, 2, 1], q: [1, 1, 2] }, expectedOutput: false },
    ],
    hiddentestcases: [
      { input: { p: [], q: [] }, expectedOutput: true },
      { input: { p: [1], q: [1] }, expectedOutput: true },
    ],
  },

  // ── GRAPHS ────────────────────────────────────────────────────────────────

  {
    id: 45,
    title: "Flood Fill",
    slug: "flood-fill",
    functionName: "floodFill",
    difficulty: "Easy",
    topic: "Graphs",
    pattern: "dfs on grid",
    sourceType: "core",
    description:
      "An image is a 2D grid of integers flattened to a 1D array with numCols columns. Given a starting pixel (sr, sc) and a new color, flood fill the image — replace the starting pixel and all connected same-color pixels with the new color. Connectivity is 4-directional.",
    examples: [
      { input: "image = [1,1,1,1,0,0,1,0,0], numCols = 3, sr = 0, sc = 0, color = 2", output: "[2,2,2,2,0,0,2,0,0]" },
      { input: "image = [0,0,0,0,0,0,0,0,0], numCols = 3, sr = 0, sc = 0, color = 0", output: "[0,0,0,0,0,0,0,0,0]" },
    ],
    constraints: ["1 <= image.length <= 2500", "numCols divides image.length evenly", "0 <= sr < rows, 0 <= sc < numCols"],
    starterCode: {
      python: `class Solution:\n    def floodFill(self, image, numCols, sr, sc, color):\n        # image is a flat list; reconstruct grid with numCols\n        pass`,
      javascript: `function floodFill(image, numCols, sr, sc, color) {\n  // image is a flat array; reconstruct grid with numCols\n}`,
      java: `class Solution {\n    public int[] floodFill(int[] image, int numCols, int sr, int sc, int color) {\n        return new int[]{};\n    }\n}`,
      cpp: `class Solution {\npublic:\n    vector<int> floodFill(vector<int>& image, int numCols, int sr, int sc, int color) {\n        return {};\n    }\n};`,
    },
    testcases: [
      { input: { image: [1,1,1,1,0,0,1,0,0], numCols: 3, sr: 0, sc: 0, color: 2 }, expectedOutput: [2,2,2,2,0,0,2,0,0] },
      { input: { image: [0,0,0,0,0,0,0,0,0], numCols: 3, sr: 0, sc: 0, color: 0 }, expectedOutput: [0,0,0,0,0,0,0,0,0] },
      { input: { image: [1,1,1,1,1,0,1,0,1], numCols: 3, sr: 1, sc: 1, color: 3 }, expectedOutput: [3,3,3,3,3,0,3,0,1] },
    ],
    hiddentestcases: [
      { input: { image: [0,0,0,0,1,1,0,1,1], numCols: 3, sr: 1, sc: 1, color: 5 }, expectedOutput: [0,0,0,0,5,5,0,5,5] },
    ],
  },

  {
    id: 46,
    title: "Number of Islands",
    slug: "number-of-islands",
    functionName: "numIslands",
    difficulty: "Medium",
    topic: "Graphs",
    pattern: "dfs / bfs on grid",
    sourceType: "core",
    description:
      "Given a 2D binary grid flattened to a 1D array of 0s and 1s with numCols columns, count the number of islands. An island is formed by connecting adjacent 1s horizontally or vertically.\n\nFor each unvisited land cell, run a DFS/BFS to mark the entire island as visited, then increment the count.",
    examples: [
      { input: "grid = [1,1,1,1,0,1,1,0,1,0,1,1,0,0,0,0,0,0,0,0], numCols = 5", output: "1" },
      { input: "grid = [1,1,0,0,0,1,1,0,0,0,0,0,1,0,0,0,0,0,1,1], numCols = 5", output: "3" },
    ],
    constraints: ["1 <= grid.length <= 90000", "numCols divides grid.length evenly", "grid[i] is 0 or 1"],
    starterCode: {
      python: `class Solution:\n    def numIslands(self, grid, numCols):\n        # grid is a flat list of 0s and 1s\n        pass`,
      javascript: `function numIslands(grid, numCols) {\n  // grid is a flat array of 0s and 1s\n}`,
      java: `class Solution {\n    public int numIslands(int[] grid, int numCols) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int numIslands(vector<int>& grid, int numCols) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { grid: [1,1,1,1,0,1,1,0,1,0,1,1,0,0,0,0,0,0,0,0], numCols: 5 }, expectedOutput: 1 },
      { input: { grid: [1,1,0,0,0,1,1,0,0,0,0,0,1,0,0,0,0,0,1,1], numCols: 5 }, expectedOutput: 3 },
      { input: { grid: [1,1,0,1,0], numCols: 5 }, expectedOutput: 2 },
    ],
    hiddentestcases: [
      { input: { grid: [0,0,0,0,0], numCols: 5 }, expectedOutput: 0 },
      { input: { grid: [1,0,1,0,1], numCols: 5 }, expectedOutput: 3 },
    ],
  },

  // ── BIT MANIPULATION ─────────────────────────────────────────────────────

  {
    id: 7,
    title: "Single Number",
    slug: "single-number",
    functionName: "singleNumber",
    difficulty: "Easy",
    topic: "Bit Manipulation",
    pattern: "xor",
    sourceType: "core",
    description:
      "Given a non-empty array of integers where every element appears twice except for one, find that single one. You must use O(n) time and O(1) space. Hint: XOR of a number with itself is 0.",
    examples: [
      { input: "nums = [2,2,1]", output: "1" },
      { input: "nums = [4,1,2,1,2]", output: "4" },
    ],
    constraints: ["1 <= nums.length <= 3 * 10^4", "Each element appears twice except for one."],
    starterCode: {
      python: `class Solution:\n    def singleNumber(self, nums):\n        pass`,
      javascript: `function singleNumber(nums) {\n\n}`,
      java: `class Solution {\n    public int singleNumber(int[] nums) {\n        return 0;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    int singleNumber(vector<int>& nums) {\n        return 0;\n    }\n};`,
    },
    testcases: [
      { input: { nums: [2, 2, 1] }, expectedOutput: 1 },
      { input: { nums: [4, 1, 2, 1, 2] }, expectedOutput: 4 },
      { input: { nums: [1] }, expectedOutput: 1 },
    ],
    hiddentestcases: [
      { input: { nums: [0, 1, 0] }, expectedOutput: 1 },
      { input: { nums: [17, 17, 42] }, expectedOutput: 42 },
    ],
  },

];

// Merge metadata into each problem.
// All fields have safe defaults so problems with missing metadata entries still work.
// pattern prefers the metadata value (allows override) but falls back to p.pattern from raw data.
const problems = rawProblems.map((p) => {
  const meta = problemMetadata[p.slug] ?? {};
  return {
    ...p,
    pattern:         meta.pattern         ?? p.pattern ?? "",
    estimatedTime:   meta.estimatedTime   ?? "",
    companies:       meta.companies       ?? [],
    relatedProblems: meta.relatedProblems ?? [],
    hints:           meta.hints           ?? [],
  };
});

export default problems;
