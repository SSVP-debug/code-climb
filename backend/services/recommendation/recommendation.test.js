import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../models/Problem.js", () => ({
  default: { findOne: vi.fn() },
}));

import Problem from "../../models/Problem.js";
import { getRecommendation } from "./RecommendationService.js";
import { getNextBestProblem } from "../../utils/recommendNextProblem.js";

// Problem.findOne(...).select(...).sort(...).lean() — chainable mock that
// resolves to whatever `result` the test configures.
function mockFindOneChain(result) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(result),
  };
  Problem.findOne.mockReturnValueOnce(chain);
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("learningPathStrategy (via getRecommendation, Priority 1)", () => {
  it("recommends the first unsolved problem in the given path, in curated order", async () => {
    mockFindOneChain({
      slug: "contains-duplicate",
      title: "Contains Duplicate",
      difficulty: "Easy",
      topic: "Arrays",
    });

    const result = await getRecommendation({
      problem: { id: 1, slug: "two-sum" },
      solvedSlugs: ["two-sum"],
      pathId: "beginner",
    });

    expect(result).toEqual({
      slug: "contains-duplicate",
      title: "Contains Duplicate",
      difficulty: "Easy",
      topic: "Arrays",
      reason: "Next challenge in your Beginner path.",
    });
    // Looked up by slug, not by id range — path order drives this, not catalog order.
    expect(Problem.findOne).toHaveBeenCalledWith({ slug: "contains-duplicate" });
  });

  it("falls through to nextUnsolvedStrategy when no pathId is given", async () => {
    mockFindOneChain({
      slug: "some-other-problem",
      title: "Some Other Problem",
      difficulty: "Medium",
      topic: null,
    });

    const result = await getRecommendation({
      problem: { id: 5, slug: "current" },
      solvedSlugs: [],
      pathId: null,
    });

    expect(result.slug).toBe("some-other-problem");
    expect(result.reason).toBe("Keep your momentum going.");
  });

  it("falls through to nextUnsolvedStrategy when every problem in the path is solved", async () => {
    // Path has 3 slugs in learningPathOrder.js's "beginner" path fixture —
    // mark all as solved so learningPathStrategy finds nothing, then the
    // global fallback should kick in.
    mockFindOneChain({
      slug: "fallback-pick",
      title: "Fallback Pick",
      difficulty: "Hard",
      topic: "DP",
    });

    const beginnerPathSlugs = [
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
    ];

    const result = await getRecommendation({
      problem: { id: 1, slug: "two-sum" },
      solvedSlugs: beginnerPathSlugs,
      pathId: "beginner",
    });

    expect(result.slug).toBe("fallback-pick");
    expect(result.reason).toBe("Keep your momentum going.");
  });

  it("falls through when the pathId doesn't match a known path", async () => {
    mockFindOneChain({
      slug: "fallback-pick",
      title: "Fallback Pick",
      difficulty: "Hard",
      topic: null,
    });

    const result = await getRecommendation({
      problem: { id: 1, slug: "two-sum" },
      solvedSlugs: [],
      pathId: "not-a-real-path",
    });

    expect(result.slug).toBe("fallback-pick");
  });
});

describe("nextUnsolvedStrategy (via getRecommendation, Priority 2)", () => {
  it("recommends the next unsolved problem ahead of the current one, in id order", async () => {
    mockFindOneChain({
      slug: "next-problem",
      title: "Next Problem",
      difficulty: "Medium",
      topic: "Strings",
    });

    const result = await getRecommendation({
      problem: { id: 10, slug: "current" },
      solvedSlugs: ["already-solved-1"],
      pathId: null,
    });

    expect(result).toEqual({
      slug: "next-problem",
      title: "Next Problem",
      difficulty: "Medium",
      topic: "Strings",
      reason: "Keep your momentum going.",
    });
    expect(Problem.findOne).toHaveBeenCalledWith({
      id: { $gt: 10 },
      slug: { $nin: ["already-solved-1"] },
      visibility: { $ne: "contest" },
    });
  });

  it("wraps around to earlier unsolved problems when nothing unsolved remains ahead", async () => {
    // First lookup (ahead) finds nothing.
    mockFindOneChain(null);
    // Second lookup (wrap-around) finds an earlier unsolved problem.
    mockFindOneChain({
      slug: "earlier-unsolved",
      title: "Earlier Unsolved",
      difficulty: "Easy",
      topic: null,
    });

    const result = await getRecommendation({
      problem: { id: 50, slug: "current" },
      solvedSlugs: [],
      pathId: null,
    });

    expect(result.slug).toBe("earlier-unsolved");
    expect(result.reason).toBe("Build on what you just practiced.");
    expect(Problem.findOne).toHaveBeenNthCalledWith(2, {
      id: { $ne: 50 },
      slug: { $nin: [] },
      visibility: { $ne: "contest" },
    });
  });
});

describe("getRecommendation — completion state (Priority 3)", () => {
  it("returns null when every problem, everywhere, is solved", async () => {
    mockFindOneChain(null); // ahead
    mockFindOneChain(null); // wrap-around

    const result = await getRecommendation({
      problem: { id: 1, slug: "two-sum" },
      solvedSlugs: [],
      pathId: null,
    });

    expect(result).toBeNull();
  });
});

describe("getNextBestProblem (public provider seam)", () => {
  it("defaults solvedSlugs/pathId when options are omitted", async () => {
    mockFindOneChain({
      slug: "next-problem",
      title: "Next Problem",
      difficulty: "Easy",
      topic: null,
    });

    const result = await getNextBestProblem({ id: 1, slug: "two-sum" });

    expect(result.slug).toBe("next-problem");
  });
});