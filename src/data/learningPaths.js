/**
 * learningPaths.js
 *
 * Static, hand-curated Learning Path bundles. Each path is an ordered
 * sequence of problem slugs — resolved against the live `problems` array
 * at render time via useLearningPaths(), never duplicated here (see that
 * file for why, and plans/001-learning-paths.md §4 for the full
 * architecture rationale).
 *
 * To add a new path: add an object to this array, following the same
 * shape. No other file needs to change for a new path to show up.
 *
 * `difficulty` here is the path's own Beginner/Intermediate/Advanced
 * scale — a different, coarser scale than an individual problem's own
 * Easy/Medium/Hard `difficulty` field. Don't conflate the two.
 */

const learningPaths = [
  {
    id: "beginner",
    name: "Beginner",
    tagline: "Master programming fundamentals through carefully selected problems.",
    difficulty: "Beginner",
    color: "teal", // key into LEARNING_PATH_COLOR_CLASSES
    icon: "Sprout", // lucide-react icon name, see learningPathIcons.js
    estimatedTime: { low: 8, high: 10, unit: "hours" },
    problemSlugs: [
      "two-sum",
      "contains-duplicate",
      "valid-parentheses",
      "best-time-to-buy-and-sell-stock",
      "maximum-subarray",
      "majority-element",
      "move-zeroes",
      "is-palindrome",
      "reverse-string",
      "missing-number",
      "longest-common-prefix",
      "single-number",
      "climbing-stairs",
      "binary-search",
      "reverse-linked-list",
      "middle-of-the-linked-list",
      "merge-two-sorted-lists",
      "valid-anagram",
    ],
  },
  {
    id: "intermediate",
    name: "Intermediate",
    tagline: "Level up with problems that combine multiple techniques.",
    difficulty: "Intermediate",
    color: "amber",
    icon: "Zap",
    estimatedTime: { low: 14, high: 18, unit: "hours" },
    problemSlugs: [
      "group-anagrams",
      "longest-substring-without-repeating-characters",
      "container-with-most-water",
      "three-sum",
      "product-of-array-except-self",
      "validate-binary-search-tree",
      "binary-tree-level-order-traversal",
      "number-of-islands",
      "course-schedule",
      "kth-largest-element",
      "subsets",
      "combination-sum",
      "house-robber",
      "coin-change",
      "word-break",
      "search-in-rotated-sorted-array",
      "top-k-frequent-elements",
      "longest-increasing-subsequence",
    ],
  },
  {
    id: "advanced",
    name: "Advanced",
    tagline: "Tackle the hardest interview problems with confidence.",
    difficulty: "Advanced",
    color: "rose",
    icon: "Flame",
    estimatedTime: { low: 20, high: 26, unit: "hours" },
    problemSlugs: [
      "trapping-rain-water",
      "median-of-two-sorted-arrays",
      "merge-k-sorted-lists",
      "word-ladder",
      "edit-distance",
      "n-queens",
      "serialize-deserialize-binary-tree",
      "lru-cache",
      "minimum-window-substring",
      "largest-rectangle-in-histogram",
      "regular-expression-matching",
      "burst-balloons",
      "word-search",
    ],
  },
];

export default learningPaths;
