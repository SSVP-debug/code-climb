import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/Problem.js", () => ({
  default: { findOne: vi.fn() },
}));
vi.mock("../controllers/compilerController.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, callJudge0: vi.fn() };
});
vi.mock("../controllers/submissionController.js", () => ({
  recordVerifiedSubmission: vi.fn().mockResolvedValue({ _id: "sub1" }),
}));
vi.mock("../services/contestScoring.js", () => ({
  awardContestSolve: vi.fn(),
}));
vi.mock("../services/battleRoomScoring.js", () => ({
  awardBattleRoomSolve: vi.fn(),
}));
vi.mock("../services/contestProblemAccess.js", () => ({
  canAccessContestProblem: vi.fn(),
}));

import Problem from "../models/Problem.js";
import { callJudge0 } from "../controllers/compilerController.js";
import { recordVerifiedSubmission } from "../controllers/submissionController.js";
import { awardBattleRoomSolve } from "../services/battleRoomScoring.js";
import { submitHandler } from "../controllers/judgeController.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockLog() {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

const baseBody = {
  problemSlug: "two-sum",
  code: "def twoSum(a): return a",
  language: "python",
  functionName: "twoSum",
  visibletestcases: [{ input: { nums: [2, 7] }, expectedOutput: [0, 1] }],
};

const problemDoc = {
  slug: "two-sum",
  title: "Two Sum",
  visibility: "public",
  hiddentestcases: [{ input: { nums: [3, 3] }, expectedOutput: [0, 1] }],
};

describe("submitHandler — Battle Room scoring", () => {
  let res, userDoc;

  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
    userDoc = { _id: "user1" };
  });

  it("does NOT attempt Battle Room scoring for an ordinary practice submission (no battleRoomId)", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    const req = { body: baseBody, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(awardBattleRoomSolve).not.toHaveBeenCalled();
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.battleRoom).toBeUndefined();
  });

  it("attempts Battle Room scoring only when the SERVER itself computed Accepted, and forwards battleRoomId to recordVerifiedSubmission", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    awardBattleRoomSolve.mockResolvedValue({
      ok: true, alreadySolvedPersonally: false, countedForTeam: true, teamScore: 100, teamIndex: 0,
    });
    const req = { body: { ...baseBody, battleRoomId: "room1" }, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(awardBattleRoomSolve).toHaveBeenCalledWith({
      battleRoomId: "room1",
      userId: "user1",
      slug: "two-sum",
    });
    expect(recordVerifiedSubmission).toHaveBeenCalledWith(
      expect.objectContaining({ battleRoomId: "room1", status: "Accepted" })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "Accepted",
        battleRoom: { scored: true, alreadySolvedPersonally: false, countedForTeam: true, teamScore: 100, teamIndex: 0 },
      })
    );
  });

  it("does NOT attempt Battle Room scoring for a Wrong Answer, even with a battleRoomId present — a forged 'Accepted' request cannot happen since status is server-computed, not client-sent", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([9, 9]), stderr: null, compile_output: null });
    const req = { body: { ...baseBody, battleRoomId: "room1" }, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(awardBattleRoomSolve).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "Wrong Answer" }));
    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.battleRoom).toBeUndefined();
  });

  it("surfaces a non-scoring reason (e.g. room not active, wrong problem, not on a team) without failing the grading response", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    awardBattleRoomSolve.mockResolvedValue({ ok: false, reason: "battle_room_not_active" });
    const req = { body: { ...baseBody, battleRoomId: "room1" }, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "Accepted",
        battleRoom: { scored: false, reason: "battle_room_not_active" },
      })
    );
  });

  it("still returns the real Accepted verdict even if awardBattleRoomSolve itself throws", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    awardBattleRoomSolve.mockRejectedValue(new Error("Mongo write failed"));
    const req = { body: { ...baseBody, battleRoomId: "room1" }, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "Accepted", battleRoom: { scored: false, reason: "error" } })
    );
    expect(req.log.error).toHaveBeenCalled();
  });

  it("idempotent duplicate Accepted: second scoring attempt reports alreadySolvedPersonally without a fresh error", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    awardBattleRoomSolve.mockResolvedValue({
      ok: true, alreadySolvedPersonally: true, countedForTeam: false, teamScore: 100, teamIndex: 0,
    });
    const req = { body: { ...baseBody, battleRoomId: "room1" }, log: mockLog(), userDoc };

    await submitHandler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        battleRoom: { scored: true, alreadySolvedPersonally: true, countedForTeam: false, teamScore: 100, teamIndex: 0 },
      })
    );
  });

  it("can score both a contest AND a battle room in the same submission when both ids are present (not mutually exclusive)", async () => {
    Problem.findOne.mockResolvedValue(problemDoc);
    callJudge0.mockResolvedValue({ stdout: JSON.stringify([0, 1]), stderr: null, compile_output: null });
    awardBattleRoomSolve.mockResolvedValue({
      ok: true, alreadySolvedPersonally: false, countedForTeam: true, teamScore: 100, teamIndex: 1,
    });
    const req = { body: { ...baseBody, battleRoomId: "room1" }, log: mockLog(), userDoc };

    await submitHandler(req, res);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.battleRoom.scored).toBe(true);
  });
});