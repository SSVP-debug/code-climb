import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/Contest.js", () => ({
  default: {
    findById: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

import Contest from "../models/Contest.js";
import { awardContestSolve, CONTEST_SOLVE_REJECTION, CONTEST_SOLVE_SCORE } from "./contestScoring.js";

function makeContest(overrides = {}) {
  const now = Date.now();
  return {
    _id: "contest1",
    startsAt: new Date(now - 60_000), // started 1 min ago
    endsAt: new Date(now + 60_000), // ends in 1 min
    problemSlugs: ["two-sum"],
    participants: [{ userId: { toString: () => "user1" }, score: 0, solvedSlugs: [] }],
    ...overrides,
  };
}

// Contest.findById is called two different ways in contestScoring.js: once
// directly awaited (`await Contest.findById(id)`), and once chained with
// `.lean()` (`await Contest.findById(id).lean()`, in the "someone already
// solved this" fallback). This helper makes a single mocked return value
// work for both call shapes — directly awaitable (via `.then`) AND
// `.lean()`-chainable — instead of needing two different mock setups.
function findByIdResult(value) {
  return {
    lean: () => Promise.resolve(value),
    then: (resolve) => resolve(value),
  };
}

describe("awardContestSolve", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects when the contest doesn't exist", async () => {
    Contest.findById.mockResolvedValue(null);

    const result = await awardContestSolve({ contestId: "nope", userId: "user1", slug: "two-sum" });

    expect(result).toEqual({ ok: false, reason: CONTEST_SOLVE_REJECTION.NOT_FOUND });
    expect(Contest.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("rejects when the contest hasn't started yet (upcoming)", async () => {
    const now = Date.now();
    Contest.findById.mockResolvedValue(
      makeContest({ startsAt: new Date(now + 60_000), endsAt: new Date(now + 120_000) })
    );

    const result = await awardContestSolve({ contestId: "contest1", userId: "user1", slug: "two-sum" });

    expect(result).toEqual({ ok: false, reason: CONTEST_SOLVE_REJECTION.NOT_ACTIVE });
  });

  it("rejects when the contest has already ended", async () => {
    const now = Date.now();
    Contest.findById.mockResolvedValue(
      makeContest({ startsAt: new Date(now - 120_000), endsAt: new Date(now - 60_000) })
    );

    const result = await awardContestSolve({ contestId: "contest1", userId: "user1", slug: "two-sum" });

    expect(result).toEqual({ ok: false, reason: CONTEST_SOLVE_REJECTION.NOT_ACTIVE });
  });

  it("rejects when the slug doesn't belong to the contest — even for a real Accepted solve on a DIFFERENT contest's problem", async () => {
    Contest.findById.mockResolvedValue(makeContest({ problemSlugs: ["some-other-problem"] }));

    const result = await awardContestSolve({ contestId: "contest1", userId: "user1", slug: "two-sum" });

    expect(result).toEqual({ ok: false, reason: CONTEST_SOLVE_REJECTION.NOT_IN_CONTEST });
    expect(Contest.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("rejects when the user never joined this contest", async () => {
    Contest.findById.mockResolvedValue(
      makeContest({ participants: [{ userId: { toString: () => "someone-else" }, score: 0, solvedSlugs: [] }] })
    );

    const result = await awardContestSolve({ contestId: "contest1", userId: "user1", slug: "two-sum" });

    expect(result).toEqual({ ok: false, reason: CONTEST_SOLVE_REJECTION.NOT_JOINED });
    expect(Contest.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("awards score atomically for a valid, active, joined solve", async () => {
    Contest.findById.mockResolvedValue(makeContest());
    Contest.findOneAndUpdate.mockResolvedValue({
      participants: [{ userId: { toString: () => "user1" }, score: CONTEST_SOLVE_SCORE }],
    });

    const result = await awardContestSolve({ contestId: "contest1", userId: "user1", slug: "two-sum" });

    expect(result).toEqual({ ok: true, alreadySolved: false, score: CONTEST_SOLVE_SCORE });
    expect(Contest.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: "contest1",
        participants: { $elemMatch: { userId: "user1", solvedSlugs: { $ne: "two-sum" } } },
      },
      {
        $push: { "participants.$.solvedSlugs": "two-sum" },
        $inc: { "participants.$.score": CONTEST_SOLVE_SCORE },
      },
      { new: true }
    );
  });

  it("is idempotent: a duplicate Accepted for an already-solved slug reports alreadySolved, not a second award", async () => {
    Contest.findById.mockReturnValueOnce(
      findByIdResult(makeContest({ participants: [{ userId: { toString: () => "user1" }, score: CONTEST_SOLVE_SCORE, solvedSlugs: ["two-sum"] }] }))
    );
    // findOneAndUpdate's filter won't match (already solved) → returns null
    // → the code falls back to a second, .lean()'d findById to report the
    // participant's current score.
    Contest.findOneAndUpdate.mockResolvedValue(null);
    Contest.findById.mockReturnValueOnce(
      findByIdResult({ participants: [{ userId: { toString: () => "user1" }, score: CONTEST_SOLVE_SCORE }] })
    );

    const result = await awardContestSolve({ contestId: "contest1", userId: "user1", slug: "two-sum" });

    expect(result).toEqual({ ok: true, alreadySolved: true, score: CONTEST_SOLVE_SCORE });
  });

  it("treats a lost race on the atomic update (findOneAndUpdate returns null) as a successful no-op, not an error — this is what makes concurrent duplicate scoring attempts safe", async () => {
    // A unit test can't independently prove Mongo's own atomicity — that's
    // Mongo's contract, not this module's. What this DOES prove: when
    // findOneAndUpdate's filter fails to match (exactly what happens when
    // a concurrent call already pushed this slug first), the code reports
    // a clean "already solved" outcome rather than throwing or silently
    // double-counting — the actual behavior that makes concurrent/duplicate
    // Accepted submissions safe in production.
    Contest.findById.mockReturnValueOnce(findByIdResult(makeContest()));
    Contest.findOneAndUpdate.mockResolvedValue(null); // lost the race
    Contest.findById.mockReturnValueOnce(
      findByIdResult({ participants: [{ userId: { toString: () => "user1" }, score: CONTEST_SOLVE_SCORE }] })
    );

    const result = await awardContestSolve({ contestId: "contest1", userId: "user1", slug: "two-sum" });

    expect(result).toEqual({ ok: true, alreadySolved: true, score: CONTEST_SOLVE_SCORE });
    // Exactly one attempted write — no retry loop silently firing a second
    // award behind the scenes.
    expect(Contest.findOneAndUpdate).toHaveBeenCalledOnce();
  });
});
