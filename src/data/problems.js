const problems = [

  // ── EASY ──────────────────────────────────────────────────────────────────

  {
    id: 1,
    title: "Two Sum",
    slug: "two-sum",
    functionName: "twoSum",
    difficulty: "Easy",
    topic: "Arrays",
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
    
  },

  {
    id: 2,
    title: "Contains Duplicate",
    slug: "contains-duplicate",
    functionName: "containsDuplicate",
    difficulty: "Easy",
    topic: "Arrays",
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
    
  },

  {
    id: 3,
    title: "Best Time to Buy and Sell Stock",
    slug: "best-time-to-buy-and-sell-stock",
    functionName: "maxProfit",
    difficulty: "Easy",
    topic: "Arrays",
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
    
  },

  {
    id: 4,
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    functionName: "isValid",
    difficulty: "Easy",
    topic: "Stacks",
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
    
  },

  {
    id: 5,
    title: "Maximum Subarray",
    slug: "maximum-subarray",
    functionName: "maxSubArray",
    difficulty: "Easy",
    topic: "Arrays",
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
    
  },

  {
    id: 6,
    title: "Climbing Stairs",
    slug: "climbing-stairs",
    functionName: "climbStairs",
    difficulty: "Easy",
    topic: "Dynamic Programming",
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
    
  },

  {
    id: 7,
    title: "Single Number",
    slug: "single-number",
    functionName: "singleNumber",
    difficulty: "Easy",
    topic: "Bit Manipulation",
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
    
  },

  {
    id: 8,
    title: "Fibonacci Number",
    slug: "fibonacci-number",
    functionName: "fib",
    difficulty: "Easy",
    topic: "Dynamic Programming",
    description:
      "The Fibonacci sequence: F(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2). Given n, calculate F(n). Try both recursive and iterative approaches — notice the difference in time complexity.",
    examples: [
      { input: "n = 2", output: "1", explanation: "F(2) = F(1) + F(0) = 1 + 0 = 1." },
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
    
  },

  // ── MEDIUM ────────────────────────────────────────────────────────────────

  {
    id: 9,
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating-characters",
    functionName: "lengthOfLongestSubstring",
    difficulty: "Medium",
    topic: "Sliding Window",
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
    
  },

  {
    id: 10,
    title: "Valid Anagram",
    slug: "valid-anagram",
    functionName: "isAnagram",
    difficulty: "Medium",
    topic: "Hash Maps",
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
    
  },

  {
    id: 11,
    title: "Container With Most Water",
    slug: "container-with-most-water",
    functionName: "maxArea",
    difficulty: "Medium",
    topic: "Two Pointers",
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
    
  },

  {
    id: 12,
    title: "House Robber",
    slug: "house-robber",
    functionName: "rob",
    difficulty: "Medium",
    topic: "Dynamic Programming",
    description:
      "You are a robber planning to rob houses along a street. Adjacent houses have connected alarms — robbing two adjacent houses alerts the police. Given an integer array nums representing money in each house, return the maximum amount you can rob without alerting police.",
    examples: [
      { input: "nums = [1,2,3,1]", output: "4", explanation: "Rob houses 1 and 3. Total = 1 + 3 = 4." },
      { input: "nums = [2,7,9,3,1]", output: "12", explanation: "Rob houses 1, 3, 5. Total = 2 + 9 + 1 = 12." },
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
    
  },

  {
    id: 13,
    title: "Coin Change",
    slug: "coin-change",
    functionName: "coinChange",
    difficulty: "Medium",
    topic: "Dynamic Programming",
    description:
      "You are given coins of different denominations and a total amount. Return the fewest coins needed to make the amount. If it cannot be made, return -1. You have an infinite number of each coin denomination.",
    examples: [
      { input: "coins = [1,5,11], amount = 15", output: "3", explanation: "5 + 5 + 5 = 15." },
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
    
  },

  {
    id: 14,
    title: "Find Minimum in Rotated Sorted Array",
    slug: "find-minimum-in-rotated-sorted-array",
    functionName: "findMin",
    difficulty: "Medium",
    topic: "Binary Search",
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
    
  },

  {
    id: 15,
    title: "Majority Element",
    slug: "majority-element",
    functionName: "majorityElement",
    difficulty: "Medium",
    topic: "Arrays",
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
    
  },

  {
    id: 16,
    title: "Longest Common Prefix",
    slug: "longest-common-prefix",
    functionName: "longestCommonPrefix",
    difficulty: "Medium",
    topic: "Strings",
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
    
  },

  // ── HARD ─────────────────────────────────────────────────────────────────

  {
    id: 17,
    title: "Trapping Rain Water",
    slug: "trapping-rain-water",
    functionName: "trap",
    difficulty: "Hard",
    topic: "Two Pointers",
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
    
  },

  {
    id: 18,
    title: "Word Break",
    slug: "word-break",
    functionName: "wordBreak",
    difficulty: "Hard",
    topic: "Dynamic Programming",
    description:
      "Given a string s and a dictionary wordDict, return true if s can be segmented into space-separated dictionary words. The same word in the dictionary may be reused multiple times.",
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
    
  },

  {
    id: 19,
    title: "Decode Ways",
    slug: "decode-ways",
    functionName: "numDecodings",
    difficulty: "Hard",
    topic: "Dynamic Programming",
    description:
      'A message can be encoded: "A"→"1", "B"→"2", ..., "Z"→"26". Given a string s of digits, return the number of ways to decode it. Note that "06" is invalid — leading zeros are not allowed.',
    examples: [
      { input: 's = "12"', output: "2", explanation: '"AB" (1,2) or "L" (12).' },
      { input: 's = "226"', output: "3", explanation: '"BZ", "VF", or "BBF".' },
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
    
  },

  {
    id: 20,
    title: "Jump Game II",
    slug: "jump-game-ii",
    functionName: "jump",
    difficulty: "Hard",
    topic: "Greedy",
    description:
      "You are at index 0 of an integer array nums. nums[i] is the maximum forward jump length from index i. Return the minimum number of jumps to reach the last index. The answer is guaranteed to exist. A greedy BFS approach gives O(n) time.",
    examples: [
      { input: "nums = [2,3,1,1,4]", output: "2", explanation: "Jump 1 step to index 1, then 3 steps to end." },
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
    
  },
];

export default problems;
