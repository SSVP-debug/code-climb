import { describe, expect, it } from "vitest";
import { computeProblemStatuses, buildPathProgress, STATUS } from "./learningPathProgress";

const problems = [
  { slug: "a" },
  { slug: "b" },
  { slug: "c" },
  { slug: "d" },
];

describe("computeProblemStatuses", () => {
  it("marks nothing solved and only the first problem as current when nothing is solved", () => {
    const statuses = computeProblemStatuses(problems, []);
    expect(statuses).toEqual([
      { slug: "a", status: STATUS.CURRENT },
      { slug: "b", status: STATUS.LOCKED },
      { slug: "c", status: STATUS.LOCKED },
      { slug: "d", status: STATUS.LOCKED },
    ]);
  });

  it("advances current to the first unsolved problem in sequence", () => {
    const statuses = computeProblemStatuses(problems, ["a"]);
    expect(statuses).toEqual([
      { slug: "a", status: STATUS.SOLVED },
      { slug: "b", status: STATUS.CURRENT },
      { slug: "c", status: STATUS.LOCKED },
      { slug: "d", status: STATUS.LOCKED },
    ]);
  });

  it("shows every problem as solved when the whole path is complete, with no current", () => {
    const statuses = computeProblemStatuses(problems, ["a", "b", "c", "d"]);
    expect(statuses.every((s) => s.status === STATUS.SOLVED)).toBe(true);
  });

  it("handles an empty path without throwing", () => {
    expect(computeProblemStatuses([], [])).toEqual([]);
  });

  it("marks an out-of-sequence solve as solved without unlocking problems ahead of the sequence gap", () => {
    // Solved "c" (via Browse, outside this path) without solving "a"/"b"
    // first. "a" must still be the current (unlocked) problem — solving
    // out of order doesn't skip the sequence for the remaining problems.
    const statuses = computeProblemStatuses(problems, ["c"]);
    expect(statuses).toEqual([
      { slug: "a", status: STATUS.CURRENT },
      { slug: "b", status: STATUS.LOCKED },
      { slug: "c", status: STATUS.SOLVED },
      { slug: "d", status: STATUS.LOCKED },
    ]);
  });
});

describe("buildPathProgress", () => {
  it("computes 0% for an unstarted path", () => {
    const progress = buildPathProgress(problems, []);
    expect(progress).toEqual({
      solvedCount: 0,
      total: 4,
      percent: 0,
      isComplete: false,
      isStarted: false,
    });
  });

  it("computes a partial percentage and isStarted", () => {
    const progress = buildPathProgress(problems, ["a", "b"]);
    expect(progress.solvedCount).toBe(2);
    expect(progress.percent).toBe(50);
    expect(progress.isStarted).toBe(true);
    expect(progress.isComplete).toBe(false);
  });

  it("marks isComplete once every problem is solved", () => {
    const progress = buildPathProgress(problems, ["a", "b", "c", "d"]);
    expect(progress.isComplete).toBe(true);
    expect(progress.percent).toBe(100);
  });

  it("does not divide by zero for an empty path", () => {
    const progress = buildPathProgress([], []);
    expect(progress).toEqual({
      solvedCount: 0,
      total: 0,
      percent: 0,
      isComplete: false,
      isStarted: false,
    });
  });
});
