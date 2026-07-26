import { describe, expect, it } from "vitest";
import {
  isChapterUnlocked,
  buildCampaignProgress,
  computeMissionStatuses,
  buildChapterProgress,
  STATUS,
} from "./codeClubEditionProgress";

describe("isChapterUnlocked", () => {
  it("is always unlocked when unlockRequirement is null", () => {
    const chapter = { comingSoon: false, unlockRequirement: null };
    expect(isChapterUnlocked(chapter, new Map())).toBe(true);
  });

  it("is locked when the prerequisite chapter isn't complete", () => {
    const chapter = { comingSoon: false, unlockRequirement: { chapterId: "ch1" } };
    const progressByChapterId = new Map([["ch1", { isComplete: false }]]);
    expect(isChapterUnlocked(chapter, progressByChapterId)).toBe(false);
  });

  it("unlocks once the prerequisite chapter is complete", () => {
    const chapter = { comingSoon: false, unlockRequirement: { chapterId: "ch1" } };
    const progressByChapterId = new Map([["ch1", { isComplete: true }]]);
    expect(isChapterUnlocked(chapter, progressByChapterId)).toBe(true);
  });

  it("is never unlocked for a comingSoon chapter, even with progress satisfied", () => {
    const chapter = { comingSoon: true, unlockRequirement: null };
    expect(isChapterUnlocked(chapter, new Map())).toBe(false);
  });
});

function makeChapter({ id, missions, solvedSlugs, unlocked, comingSoon = false }) {
  const missionStatuses = computeMissionStatuses(missions, solvedSlugs);
  const progress = buildChapterProgress(missions, solvedSlugs);
  return { id, comingSoon, unlocked, progress, missionStatuses };
}

describe("buildCampaignProgress", () => {
  it("targets the first unlocked, incomplete chapter's current mission", () => {
    const ch1 = makeChapter({
      id: "ch1",
      missions: [{ slug: "a" }, { slug: "b" }],
      solvedSlugs: ["a"],
      unlocked: true,
    });
    const ch2 = makeChapter({
      id: "ch2",
      missions: [{ slug: "c" }, { slug: "d" }],
      solvedSlugs: [],
      unlocked: false,
    });

    const result = buildCampaignProgress([ch1, ch2]);

    expect(result.currentChapterId).toBe("ch1");
    expect(result.continueTarget).toEqual({ chapterId: "ch1", slug: "b" });
    expect(result.totalMissions).toBe(4);
    expect(result.solvedMissions).toBe(1);
    expect(result.percent).toBe(25);
    expect(result.isComplete).toBe(false);
  });

  it("skips a completed chapter and targets the next unlocked one", () => {
    const ch1 = makeChapter({
      id: "ch1",
      missions: [{ slug: "a" }],
      solvedSlugs: ["a"],
      unlocked: true,
    });
    const ch2 = makeChapter({
      id: "ch2",
      missions: [{ slug: "b" }, { slug: "c" }],
      solvedSlugs: [],
      unlocked: true,
    });

    const result = buildCampaignProgress([ch1, ch2]);

    expect(result.currentChapterId).toBe("ch2");
    expect(result.continueTarget).toEqual({ chapterId: "ch2", slug: "b" });
  });

  it("excludes comingSoon chapters from totals entirely", () => {
    const ch1 = makeChapter({
      id: "ch1",
      missions: [{ slug: "a" }],
      solvedSlugs: ["a"],
      unlocked: true,
    });
    const soon = makeChapter({
      id: "ch2",
      missions: [],
      solvedSlugs: [],
      unlocked: false,
      comingSoon: true,
    });

    const result = buildCampaignProgress([ch1, soon]);

    expect(result.totalMissions).toBe(1);
    expect(result.isComplete).toBe(true);
    expect(result.continueTarget).toBeNull();
  });

  it("falls back to the first unlocked chapter when everything is complete", () => {
    const ch1 = makeChapter({
      id: "ch1",
      missions: [{ slug: "a" }],
      solvedSlugs: ["a"],
      unlocked: true,
    });

    const result = buildCampaignProgress([ch1]);

    expect(result.currentChapterId).toBe("ch1");
    expect(result.continueTarget).toBeNull();
    expect(result.isComplete).toBe(true);
  });
});

describe("re-exports", () => {
  it("computeMissionStatuses behaves like computeProblemStatuses", () => {
    const statuses = computeMissionStatuses([{ slug: "a" }, { slug: "b" }], []);
    expect(statuses).toEqual([
      { slug: "a", status: STATUS.CURRENT },
      { slug: "b", status: STATUS.LOCKED },
    ]);
  });
});