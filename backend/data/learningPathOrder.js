/**
 * learningPathOrder.js
 *
 * Learning Paths are still frontend-only data (see src/data/learningPaths.js
 * and src/hooks/useLearningPaths.js's header comment: "if paths ever move
 * to a backend model, only this file changes"). They haven't moved yet.
 *
 * The "Next Best Problem" recommendation (Priority 1: recommend the next
 * unlocked problem in the user's current Learning Path) needs to run
 * server-side, because that's where solved-state + problem metadata
 * already live and get merged for the API response. That means the
 * backend needs *some* notion of path ordering.
 *
 * Rather than duplicate the full curated path objects (name, tagline,
 * color, icon, estimatedTime — all purely presentational, all frontend
 * concerns), this file mirrors ONLY what the recommendation logic needs:
 * `id` (to match the `?path=` query param) and `name` (for the
 * human-readable reason string, e.g. "Continue your Beginner path.") and
 * the ordered `problemSlugs`.
 *
 * ⚠️ Keep in sync with src/data/learningPaths.js — if a path's problem
 * order changes there, mirror the `problemSlugs` order here too. This is
 * intentionally minimal, explicit duplication (not a shared package)
 * because the two apps deploy independently (Vercel frontend / Railway
 * backend) with no shared module boundary today. When Learning Paths
 * eventually move to a real backend model (per the note above), this
 * file is deleted and the strategy below reads from that model instead —
 * see strategies/learningPathStrategy.js.
 */

const learningPathOrder = [
  {
    id: "beginner",
    name: "Beginner",
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

export function findLearningPathById(pathId) {
  if (!pathId) return null;
  return learningPathOrder.find((path) => path.id === pathId) ?? null;
}

export default learningPathOrder;