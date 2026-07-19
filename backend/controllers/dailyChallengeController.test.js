import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../services/userProgressService.js", () => ({
  saveProgress: vi.fn().mockResolvedValue({ acknowledged: true }),
}));

import { saveProgress } from "../services/userProgressService.js";
import { completeDailyChallenge } from "./dailyChallengeController.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides = {}) {
  return {
    body: {},
    log: { error: vi.fn(), warn: vi.fn() },
    userDoc: { _id: "u1", dailyChallengeHistory: [] },
    ...overrides,
  };
}

describe("completeDailyChallenge", () => {
  let res;

  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
  });

  it("400s if slug is missing", async () => {
    await completeDailyChallenge(mockReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(saveProgress).not.toHaveBeenCalled();
  });

  it("appends today's entry and dual-writes via saveProgress", async () => {
    const req = mockReq({ body: { slug: "two-sum" } });

    await completeDailyChallenge(req, res);

    expect(req.userDoc.dailyChallengeHistory).toHaveLength(1);
    expect(req.userDoc.dailyChallengeHistory[0]).toMatchObject({
      slug: "two-sum",
      completed: true,
    });
    expect(saveProgress).toHaveBeenCalledWith(
      "u1",
      { dailyChallengeHistory: req.userDoc.dailyChallengeHistory }
    );
    expect(res.json).toHaveBeenCalledWith({ success: true, alreadyCompleted: false });
  });

  it("is a no-op (and doesn't write) if today's challenge was already completed", async () => {
    const today = new Date().toISOString().split("T")[0];
    const req = mockReq({
      body: { slug: "two-sum" },
      userDoc: {
        _id: "u1",
        dailyChallengeHistory: [{ date: today, slug: "two-sum", completed: true }],
      },
    });

    await completeDailyChallenge(req, res);

    expect(saveProgress).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, alreadyCompleted: true });
  });

  it("returns 500 if the dual-write fails", async () => {
    saveProgress.mockRejectedValueOnce(new Error("db down"));
    const req = mockReq({ body: { slug: "two-sum" } });

    await completeDailyChallenge(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
