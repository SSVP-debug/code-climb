import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/Submission.js", () => ({
  default: { create: vi.fn(), find: vi.fn() },
  SUBMISSION_STATUSES: [
    "Accepted",
    "Wrong Answer",
    "Compilation Error",
    "Runtime Error",
    "Time Limit Exceeded",
    "Judge Error",
  ],
}));

import Submission, { SUBMISSION_STATUSES } from "../models/Submission.js";
import { createSubmission, recordVerifiedSubmission } from "./submissionController.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("createSubmission (POST /api/submissions) — locked down", () => {
  it("returns 410 Gone and does not write anything, regardless of what the client sends", async () => {
    const res = mockRes();
    const req = {
      userDoc: { _id: "user1" },
      body: {
        // The old exploit payload — must have zero effect now.
        problemSlug: "two-sum",
        status: "Accepted",
        passed: 999,
        total: 999,
      },
    };

    await createSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(410);
    expect(Submission.create).not.toHaveBeenCalled();
  });
});

describe("recordVerifiedSubmission — internal, server-only writer", () => {
  beforeEach(() => vi.clearAllMocks());

  it("writes exactly the fields it's given, with a valid status", async () => {
    Submission.create.mockResolvedValue({ _id: "sub1" });

    await recordVerifiedSubmission({
      userId: "user1",
      problemSlug: "two-sum",
      problemTitle: "Two Sum",
      language: "python",
      code: "def twoSum(): pass",
      status: "Accepted",
      passed: 2,
      total: 2,
      visiblePassed: 1,
      hiddenPassed: 1,
      executionTime: "120",
    });

    expect(Submission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user1",
        problemSlug: "two-sum",
        status: "Accepted",
        passed: 2,
        total: 2,
      })
    );
  });

  it("rejects a status outside the known enum rather than writing garbage to the DB", async () => {
    await expect(
      recordVerifiedSubmission({
        userId: "user1",
        problemSlug: "two-sum",
        problemTitle: "Two Sum",
        language: "python",
        code: "x",
        status: "Definitely Accepted Trust Me",
        passed: 1,
        total: 1,
      })
    ).rejects.toThrow(/invalid status/i);

    expect(Submission.create).not.toHaveBeenCalled();
  });

  it("every status this function is asked to write is one submitHandler can actually produce", () => {
    // Sanity check that the enum used for validation matches what's
    // actually exported from the model — if these ever drift apart,
    // recordVerifiedSubmission would start rejecting real judge results.
    expect(SUBMISSION_STATUSES).toEqual(
      expect.arrayContaining(["Accepted", "Wrong Answer", "Compilation Error", "Runtime Error", "Judge Error"])
    );
  });
});
