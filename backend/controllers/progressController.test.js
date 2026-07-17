import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/Problem.js", () => ({
  default: { find: vi.fn() },
}));
vi.mock("../services/achievementService.js", () => ({
  evaluateAchievements: vi.fn().mockReturnValue([]),
}));
vi.mock("../routes/leaderboard.js", () => ({
  invalidateLeaderboardCaches: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("./publicProfileController.js", () => ({
  invalidateProfileCache: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../routes/tpo.js", () => ({
  invalidateTpoCache: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../services/notificationService.js", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

import Problem from "../models/Problem.js";
import { putProgress } from "./progressController.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockLog() {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

function makeUserDoc(overrides = {}) {
  return {
    _id: "user1",
    email: "student@college.edu",
    username: "student1",
    solvedSlugs: [],
    topicStats: {},
    solvedDifficulty: { easy: 0, medium: 0, hard: 0 },
    activityDates: [],
    recentActivity: [],
    achievements: [],
    currentStreak: 0,
    longestStreak: 0,
    totalXP: 0,
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// Problem.find({...}).select(...).lean() — chainable mock helper.
function mockProblemFind(problems) {
  Problem.find.mockReturnValue({
    select: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue(problems),
    }),
  });
}

describe("putProgress — trusts req.verifiedNewSlugs, never the raw request body", () => {
  let res;

  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
  });

  it(
    "ignores a forged solvedSlugs array entirely when verifyAgainstSubmissions " +
      "found nothing to verify — this is the actual regression test for the fix",
    async () => {
      mockProblemFind([]); // recomputeXP's lookup — nothing solved, nothing to find
      const userDoc = makeUserDoc();
      const req = {
        // A client attempting the original exploit: claim everything, verify nothing.
        body: { solvedSlugs: ["two-sum", "reverse-linked-list", "n-queens"] },
        verifiedNewSlugs: [], // set by verifyAgainstSubmissions — nothing checked out
        userDoc,
        log: mockLog(),
      };

      await putProgress(req, res);

      expect(userDoc.solvedSlugs).toEqual([]);
      expect(userDoc.totalXP).toBe(0);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ solvedSlugs: [] })
      );
    }
  );

  it("applies only the slugs verifyAgainstSubmissions actually verified, deriving topic/difficulty from Problem, not the body", async () => {
    mockProblemFind([
      { slug: "two-sum", topic: "Arrays", difficulty: "Easy", title: "Two Sum" },
    ]);
    const userDoc = makeUserDoc();
    const req = {
      body: {
        // Client tries to claim it was Hard and in a fake topic — must be ignored.
        solvedSlugs: ["two-sum"],
        topicStats: { "Fake Topic": 999 },
        solvedDifficulty: { hard: 999 },
      },
      verifiedNewSlugs: ["two-sum"],
      userDoc,
      log: mockLog(),
    };

    await putProgress(req, res);

    expect(userDoc.solvedSlugs).toEqual(["two-sum"]);
    // Derived from the Problem doc (Easy / Arrays), NOT from the client's
    // claimed { hard: 999 } / { "Fake Topic": 999 }.
    expect(userDoc.solvedDifficulty.easy).toBe(1);
    expect(userDoc.solvedDifficulty.hard).toBe(0);
    expect(Object.fromEntries(userDoc.topicStats)).toEqual({ Arrays: 1 });
  });

  it("only ever adds today's date to activityDates, never client-supplied past dates (anti streak-forgery)", async () => {
    mockProblemFind([
      { slug: "two-sum", topic: "Arrays", difficulty: "Easy", title: "Two Sum" },
    ]);
    const userDoc = makeUserDoc();
    const today = new Date().toISOString().split("T")[0];
    const req = {
      body: {
        solvedSlugs: ["two-sum"],
        // Client tries to backfill a 30-day streak that never happened.
        activityDates: [
          "2020-01-01", "2020-01-02", "2020-01-03", "2020-01-04",
        ],
      },
      verifiedNewSlugs: ["two-sum"],
      userDoc,
      log: mockLog(),
    };

    await putProgress(req, res);

    expect(userDoc.activityDates).toEqual([today]);
    expect(userDoc.currentStreak).toBe(1);
  });

  it("is idempotent — re-submitting an already-solved slug doesn't double-count", async () => {
    const userDoc = makeUserDoc({
      solvedSlugs: ["two-sum"],
      solvedDifficulty: { easy: 1, medium: 0, hard: 0 },
    });
    const req = {
      body: { solvedSlugs: ["two-sum"] },
      // verifyAgainstSubmissions already excludes already-trusted slugs —
      // simulate that here too.
      verifiedNewSlugs: [],
      userDoc,
      log: mockLog(),
    };

    mockProblemFind([]); // recomputeXP lookup for the one already-solved slug
    await putProgress(req, res);

    expect(userDoc.solvedSlugs).toEqual(["two-sum"]);
    expect(userDoc.solvedDifficulty.easy).toBe(1);
  });

  it("still updates leetcodeUsername (self-reported, not a trust boundary) alongside a verified solve", async () => {
    mockProblemFind([]);
    const userDoc = makeUserDoc();
    const req = {
      body: { leetcodeUsername: "coder123" },
      verifiedNewSlugs: [],
      userDoc,
      log: mockLog(),
    };

    await putProgress(req, res);

    expect(userDoc.leetcodeUsername).toBe("coder123");
  });

  it("returns 503 when the database/user document is unavailable", async () => {
    const req = { body: {}, verifiedNewSlugs: [], userDoc: null, log: mockLog() };

    await putProgress(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
  });
});
