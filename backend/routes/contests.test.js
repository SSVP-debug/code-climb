import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/Contest.js", () => ({
  default: {
    find: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
  },
}));
vi.mock("../models/Problem.js", () => ({
  default: { countDocuments: vi.fn() },
}));
vi.mock("../models/Submission.js", () => ({
  default: { exists: vi.fn() },
}));
vi.mock("../utils/cache.js", () => ({
  // Bypass real caching — always a "miss," run the factory directly. This
  // suite is about contest business logic, not the caching layer.
  getOrSetCache: vi.fn(async (key, ttl, fetchFn) => ({ value: await fetchFn(), cacheStatus: "MISS" })),
}));
vi.mock("../services/contestScoring.js", () => ({
  awardContestSolve: vi.fn(),
}));

import Contest from "../models/Contest.js";
import Problem from "../models/Problem.js";
import Submission from "../models/Submission.js";
import { awardContestSolve } from "../services/contestScoring.js";
import contestsRouter from "./contests.js";

// contests.js doesn't export its handlers individually — pull them off the
// real router's stack (same convention as routes/leaderboard.test.js). This
// exercises the actual handler code, not a re-implementation of it, and
// deliberately skips over any auth/role middleware registered on the same
// route (that layer has its own dedicated tests — middleware/auth.test.js,
// middleware/roleGuard.test.js).
function getHandler(method, path) {
  const layer = contestsRouter.stack.find(
    (l) => l.route && l.route.path === path && l.route.methods[method]
  );
  if (!layer) throw new Error(`No ${method.toUpperCase()} route registered for path ${path}`);
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.set = vi.fn().mockReturnValue(res);
  return res;
}

function userDoc(overrides = {}) {
  return {
    _id: "user1",
    username: "alice",
    displayName: "Alice",
    role: "student",
    education: { emailVerified: true },
    tpoProfile: {},
    ...overrides,
  };
}

function makeContestDoc(overrides = {}) {
  const now = Date.now();
  const doc = {
    _id: "contest1",
    title: "Test Contest",
    type: "private",
    inviteCode: "ABC123",
    createdBy: "organizer1",
    startsAt: new Date(now - 60_000),
    endsAt: new Date(now + 60_000),
    problemSlugs: ["two-sum"],
    participants: [],
    maxParticipants: null,
    allowLateJoin: true,
    ...overrides,
  };
  doc.save = vi.fn().mockResolvedValue(doc);
  doc.toObject = vi.fn().mockReturnValue({ ...doc });
  return doc;
}

// Contest.findOne is used two different ways in contests.js: chained with
// `.lean()` (the "existing active hosted contest" guard in POST /private),
// and directly awaited with no chain (POST /join-private). This helper
// works for both call shapes, same as contestScoring.test.js's
// findByIdResult and for the identical reason.
function queryResult(value) {
  return {
    lean: () => Promise.resolve(value),
    then: (resolve) => resolve(value),
  };
}

describe("POST /api/contests/private — create private contest", () => {
  let res;
  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
  });

  it("creates a private contest for a verified student within guardrails", async () => {
    Problem.countDocuments.mockResolvedValue(1);
    Contest.findOne.mockReturnValue(queryResult(null)); // no existing active hosted contest
    Contest.create.mockResolvedValue(makeContestDoc());

    const req = {
      body: {
        title: "My Contest",
        problemSlugs: ["two-sum"],
        startsAt: new Date(Date.now() + 3_600_000).toISOString(),
        endsAt: new Date(Date.now() + 3_600_000 + 60 * 60_000).toISOString(),
      },
      userDoc: userDoc(),
    };

    await getHandler("post", "/private")(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(Contest.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: "private", problemSlugs: ["two-sum"] })
    );
  });

  it("rejects an unverified student's attempt to host a contest", async () => {
    const req = {
      body: {
        title: "My Contest",
        problemSlugs: ["two-sum"],
        startsAt: new Date(Date.now() + 3_600_000).toISOString(),
        endsAt: new Date(Date.now() + 3_600_000 + 60 * 60_000).toISOString(),
      },
      userDoc: userDoc({ education: { emailVerified: false } }),
    };

    await getHandler("post", "/private")(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(Contest.create).not.toHaveBeenCalled();
  });

  it("rejects a student trying to host more problems than the guardrail allows", async () => {
    const req = {
      body: {
        title: "My Contest",
        problemSlugs: Array.from({ length: 9 }, (_, i) => `p${i}`),
        startsAt: new Date(Date.now() + 3_600_000).toISOString(),
        endsAt: new Date(Date.now() + 3_600_000 + 60 * 60_000).toISOString(),
      },
      userDoc: userDoc(),
    };

    await getHandler("post", "/private")(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Contest.create).not.toHaveBeenCalled();
  });

  it("rejects a student who already has an active/upcoming hosted contest (one at a time)", async () => {
    Contest.findOne.mockReturnValue(queryResult(makeContestDoc())); // existing active contest

    const req = {
      body: {
        title: "Second Contest",
        problemSlugs: ["two-sum"],
        startsAt: new Date(Date.now() + 3_600_000).toISOString(),
        endsAt: new Date(Date.now() + 3_600_000 + 60 * 60_000).toISOString(),
      },
      userDoc: userDoc(),
    };

    await getHandler("post", "/private")(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(Contest.create).not.toHaveBeenCalled();
  });

  it("rejects invalid problem slugs (fewer real problems found than requested)", async () => {
    Contest.findOne.mockReturnValue(queryResult(null));
    Problem.countDocuments.mockResolvedValue(0); // neither slug exists

    const req = {
      body: {
        title: "My Contest",
        problemSlugs: ["not-a-real-slug"],
        startsAt: new Date(Date.now() + 3_600_000).toISOString(),
        endsAt: new Date(Date.now() + 3_600_000 + 60 * 60_000).toISOString(),
      },
      userDoc: userDoc(),
    };

    await getHandler("post", "/private")(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Contest.create).not.toHaveBeenCalled();
  });

  it("retries invite code generation once on a duplicate-key collision (P1-5), then succeeds", async () => {
    Problem.countDocuments.mockResolvedValue(1);
    Contest.findOne.mockReturnValue(queryResult(null));

    const dupError = Object.assign(new Error("duplicate key"), {
      code: 11000,
      keyPattern: { inviteCode: 1 },
    });
    Contest.create
      .mockRejectedValueOnce(dupError)
      .mockResolvedValueOnce(makeContestDoc());

    const req = {
      body: {
        title: "My Contest",
        problemSlugs: ["two-sum"],
        startsAt: new Date(Date.now() + 3_600_000).toISOString(),
        endsAt: new Date(Date.now() + 3_600_000 + 60 * 60_000).toISOString(),
      },
      userDoc: userDoc(),
    };

    await getHandler("post", "/private")(req, res);

    expect(Contest.create).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("does not mask an unrelated database error as an invite-code collision (no pointless retry)", async () => {
    Problem.countDocuments.mockResolvedValue(1);
    Contest.findOne.mockReturnValue(queryResult(null));
    Contest.create.mockRejectedValue(new Error("Mongo is down"));

    const req = {
      body: {
        title: "My Contest",
        problemSlugs: ["two-sum"],
        startsAt: new Date(Date.now() + 3_600_000).toISOString(),
        endsAt: new Date(Date.now() + 3_600_000 + 60 * 60_000).toISOString(),
      },
      userDoc: userDoc(),
    };

    await getHandler("post", "/private")(req, res);

    expect(Contest.create).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("POST /api/contests/join-private — join via invite code", () => {
  let res;
  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
  });

  it("joins a participant who provides a valid, uppercased invite code", async () => {
    const contest = makeContestDoc({ participants: [] });
    Contest.findOne.mockResolvedValue(contest);

    const req = { body: { inviteCode: "abc123" }, userDoc: userDoc() };
    await getHandler("post", "/join-private")(req, res);

    expect(Contest.findOne).toHaveBeenCalledWith({ inviteCode: "ABC123", type: "private" });
    expect(contest.participants).toHaveLength(1);
    expect(contest.save).toHaveBeenCalledOnce();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, contestId: "contest1" })
    );
  });

  it("rejects an invalid invite code", async () => {
    Contest.findOne.mockResolvedValue(null);

    const req = { body: { inviteCode: "ZZZZZZ" }, userDoc: userDoc() };
    await getHandler("post", "/join-private")(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("does not double-join — a second join attempt by the same user returns alreadyJoined, doesn't push a duplicate participant", async () => {
    const contest = makeContestDoc({
      participants: [{ userId: { toString: () => "user1" }, score: 0, solvedSlugs: [] }],
    });
    Contest.findOne.mockResolvedValue(contest);

    const req = { body: { inviteCode: "ABC123" }, userDoc: userDoc() };
    await getHandler("post", "/join-private")(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ alreadyJoined: true }));
    expect(contest.save).not.toHaveBeenCalled();
    expect(contest.participants).toHaveLength(1); // unchanged, not duplicated
  });

  it("rejects joining a contest that's already at its participant cap", async () => {
    const contest = makeContestDoc({
      maxParticipants: 2,
      participants: [
        { userId: { toString: () => "other1" }, score: 0, solvedSlugs: [] },
        { userId: { toString: () => "other2" }, score: 0, solvedSlugs: [] },
      ],
    });
    Contest.findOne.mockResolvedValue(contest);

    const req = { body: { inviteCode: "ABC123" }, userDoc: userDoc() };
    await getHandler("post", "/join-private")(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(contest.save).not.toHaveBeenCalled();
  });

  it("rejects a late join once the contest is active and allowLateJoin is false", async () => {
    const contest = makeContestDoc({ allowLateJoin: false }); // startsAt/endsAt from makeContestDoc default to "active"
    Contest.findOne.mockResolvedValue(contest);

    const req = { body: { inviteCode: "ABC123" }, userDoc: userDoc() };
    await getHandler("post", "/join-private")(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(contest.save).not.toHaveBeenCalled();
  });

  it("rejects joining a contest that has already ended", async () => {
    const now = Date.now();
    const contest = makeContestDoc({
      startsAt: new Date(now - 120_000),
      endsAt: new Date(now - 60_000),
      status: "ended",
    });
    Contest.findOne.mockResolvedValue(contest);

    const req = { body: { inviteCode: "ABC123" }, userDoc: userDoc() };
    await getHandler("post", "/join-private")(req, res);

    expect(res.status).toHaveBeenCalledWith(410);
  });
});

describe("GET /api/contests/:id — detail + leaderboard (contains P0-2's leak fix)", () => {
  let res;
  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
  });

  it("hides problemSlugs for an upcoming contest from a non-organizer", async () => {
    const now = Date.now();
    Contest.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue(
        makeContestDoc({
          startsAt: new Date(now + 60_000),
          endsAt: new Date(now + 120_000),
          createdBy: "organizer1",
          participants: [],
        })
      ),
    });

    const req = { params: { id: "contest1" }, userDoc: userDoc({ _id: "user1" }) };
    await getHandler("get", "/:id")(req, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.problemSlugs).toBeUndefined();
    expect(payload.problemCount).toBe(1); // count still shown — documented acceptable detail
  });

  it("reveals problemSlugs for an upcoming contest to its own organizer", async () => {
    const now = Date.now();
    Contest.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue(
        makeContestDoc({
          startsAt: new Date(now + 60_000),
          endsAt: new Date(now + 120_000),
          createdBy: "organizer1",
          participants: [],
        })
      ),
    });

    const req = { params: { id: "contest1" }, userDoc: userDoc({ _id: "organizer1" }) };
    await getHandler("get", "/:id")(req, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.problemSlugs).toEqual(["two-sum"]);
  });

  it("reveals problemSlugs to everyone once the contest is active", async () => {
    Contest.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue(makeContestDoc()), // active by default
    });

    const req = { params: { id: "contest1" }, userDoc: userDoc({ _id: "some-random-user" }) };
    await getHandler("get", "/:id")(req, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.problemSlugs).toEqual(["two-sum"]);
  });

  it("ranks the leaderboard by score descending, tiebroken by earliest join", async () => {
    const t0 = new Date("2026-01-01T10:00:00Z");
    const t1 = new Date("2026-01-01T10:05:00Z");
    Contest.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue(
        makeContestDoc({
          participants: [
            { userId: { toString: () => "low" }, score: 50, joinedAt: t0, solvedSlugs: [] },
            { userId: { toString: () => "high" }, score: 200, joinedAt: t1, solvedSlugs: [] },
            { userId: { toString: () => "tied-early" }, score: 100, joinedAt: t0, solvedSlugs: [] },
            { userId: { toString: () => "tied-late" }, score: 100, joinedAt: t1, solvedSlugs: [] },
          ],
        })
      ),
    });

    const req = { params: { id: "contest1" }, userDoc: userDoc({ _id: "nobody" }) };
    await getHandler("get", "/:id")(req, res);

    const payload = res.json.mock.calls[0][0];
    const order = payload.leaderboard.map((p) => p.userId.toString());
    expect(order).toEqual(["high", "tied-early", "tied-late", "low"]);
  });

  it("returns 404 for a contest that doesn't exist", async () => {
    Contest.findById.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

    const req = { params: { id: "nope" }, userDoc: userDoc() };
    await getHandler("get", "/:id")(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("POST /api/contests/:id/solve — legacy endpoint (P0-1 attack + proof-gated success)", () => {
  let res;
  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
  });

  it("[ATTACK TEST] rejects a bare client claim with no verified Accepted submission — no score, no solved slug", async () => {
    Submission.exists.mockResolvedValue(null); // no proof exists

    const req = { params: { id: "contest1" }, body: { slug: "two-sum" }, userDoc: userDoc() };
    await getHandler("post", "/:id/solve")(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(awardContestSolve).not.toHaveBeenCalled();
  });

  it("awards credit when a real verified Accepted Submission exists for this exact user+problem+contest", async () => {
    Submission.exists.mockResolvedValue({ _id: "sub1" });
    awardContestSolve.mockResolvedValue({ ok: true, alreadySolved: false, score: 100 });

    const req = { params: { id: "contest1" }, body: { slug: "two-sum" }, userDoc: userDoc() };
    await getHandler("post", "/:id/solve")(req, res);

    expect(Submission.exists).toHaveBeenCalledWith({
      userId: "user1",
      problemSlug: "two-sum",
      contestId: "contest1",
      status: "Accepted",
    });
    expect(awardContestSolve).toHaveBeenCalledWith({ contestId: "contest1", userId: "user1", slug: "two-sum" });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, score: 100 })
    );
  });

  it("does not award credit for a proof submission that belongs to a DIFFERENT contest", async () => {
    // Submission.exists is called with contestId scoped to req.params.id —
    // simulate the (correct) real Mongo behavior of finding nothing when
    // the caller's real Accepted submission was for a different contest.
    Submission.exists.mockResolvedValue(null);

    const req = { params: { id: "contest-B" }, body: { slug: "two-sum" }, userDoc: userDoc() };
    await getHandler("post", "/:id/solve")(req, res);

    expect(Submission.exists).toHaveBeenCalledWith(
      expect.objectContaining({ contestId: "contest-B" })
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(awardContestSolve).not.toHaveBeenCalled();
  });
});
