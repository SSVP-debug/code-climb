const problems = [
  {
    id: 1,

    title: "Two Sum",

    slug: "two-sum",

    difficulty: "Easy",

    topic: "Arrays",

    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",

    examples: [
      {
        input:
          "nums = [2,7,11,15], target = 9",

        output: "[0,1]",
      },
    ],

    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "Only one valid answer exists.",
    ],

    starterCode: {
      python:
`def twoSum(nums, target):
    # Write your solution here
    pass`,

      javascript:
`function twoSum(nums, target) {
  // Write your solution here
}`,

      java:
`class Solution {
    public int[] twoSum(int[] nums, int target) {

    }
}`,

      cpp:
`class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {

    }
};`,
    },
  },

  {
    id: 2,

    title:
      "Binary Tree Level Order Traversal",

    slug:
      "binary-tree-level-order-traversal",

    difficulty: "Medium",

    topic: "Trees",

    description:
      "Given the root of a binary tree, return the level order traversal of its nodes' values.",

    examples: [
      {
        input:
          "root = [3,9,20,null,null,15,7]",

        output:
          "[[3],[9,20],[15,7]]",
      },
    ],

    constraints: [
      "The number of nodes in the tree is in the range [0, 2000].",
    ],

    starterCode: {
      python:
`class Solution:
    def levelOrder(self, root):
        pass`,

      javascript:
`function levelOrder(root) {

}`,

      java:
`class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {

    }
}`,

      cpp:
`class Solution {
public:
    vector<vector<int>> levelOrder(TreeNode* root) {

    }
};`,
    },
  },
];

export default problems;