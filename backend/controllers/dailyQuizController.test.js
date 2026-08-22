import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import {
  getDailyQuizStatus,
  completeDailyQuiz,
} from "./dailyQuizController.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides = {}) {
  return {
    log: { error: vi.fn(), warn: vi.fn() },
    userDoc: {
      _id: "u1",
      dailyQuizCompletedDate: null,
      save: vi.fn().mockResolvedValue(undefined),
    },
    ...overrides,
  };
}

describe("dailyQuizController", () => {
  let res;

  beforeEach(() => {
    res = mockRes();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-21T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getDailyQuizStatus", () => {
    it("required=true, completed=false when never completed", () => {
      const req = mockReq();

      getDailyQuizStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({ required: true, completed: false });
    });

    it("required=false, completed=true when completed today", () => {
      const req = mockReq({
        userDoc: { _id: "u1", dailyQuizCompletedDate: "2026-08-21" },
      });

      getDailyQuizStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({ required: false, completed: true });
    });

    it("required=true when completion is from a previous day", () => {
      const req = mockReq({
        userDoc: { _id: "u1", dailyQuizCompletedDate: "2026-08-20" },
      });

      getDailyQuizStatus(req, res);

      expect(res.json).toHaveBeenCalledWith({ required: true, completed: false });
    });

    it("does not leak anything beyond required/completed", () => {
      const req = mockReq();

      getDailyQuizStatus(req, res);

      const body = res.json.mock.calls[0][0];
      expect(Object.keys(body).sort()).toEqual(["completed", "required"]);
    });
  });

  describe("completeDailyQuiz", () => {
    it("records today's date and saves", async () => {
      const req = mockReq();

      await completeDailyQuiz(req, res);

      expect(req.userDoc.dailyQuizCompletedDate).toBe("2026-08-21");
      expect(req.userDoc.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ required: false, completed: true });
    });

    it("is idempotent — does not re-save if already completed today", async () => {
      const req = mockReq({
        userDoc: {
          _id: "u1",
          dailyQuizCompletedDate: "2026-08-21",
          save: vi.fn().mockResolvedValue(undefined),
        },
      });

      await completeDailyQuiz(req, res);

      expect(req.userDoc.save).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ required: false, completed: true });
    });

    it("overwrites a stale previous-day completion", async () => {
      const req = mockReq({
        userDoc: {
          _id: "u1",
          dailyQuizCompletedDate: "2026-08-20",
          save: vi.fn().mockResolvedValue(undefined),
        },
      });

      await completeDailyQuiz(req, res);

      expect(req.userDoc.dailyQuizCompletedDate).toBe("2026-08-21");
      expect(req.userDoc.save).toHaveBeenCalled();
    });

    it("returns 500 and does not unlock if save fails", async () => {
      const req = mockReq({
        userDoc: {
          _id: "u1",
          dailyQuizCompletedDate: null,
          save: vi.fn().mockRejectedValue(new Error("db down")),
        },
      });

      await completeDailyQuiz(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).not.toHaveBeenCalledWith({ required: false, completed: true });
    });
  });
});
