import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/User.js", () => ({
  default: { findOne: vi.fn() },
}));
vi.mock("../models/RecruiterInterest.js", () => ({
  default: { findOne: vi.fn(), create: vi.fn() },
}));
vi.mock("../services/notificationService.js", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

import User from "../models/User.js";
import RecruiterInterest from "../models/RecruiterInterest.js";
import { createNotification } from "../services/notificationService.js";
import { handleCreateInterest } from "./recruiter.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const recruiterUserDoc = {
  _id: "recruiter1",
  recruiterProfile: { companyName: "Acme Corp" },
};

const candidateDoc = { _id: "candidate1", username: "jdoe" };

describe("handleCreateInterest", () => {
  let res;

  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(candidateDoc) });
    RecruiterInterest.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
    RecruiterInterest.create.mockResolvedValue({ _id: "interest1", createdAt: new Date("2026-01-01") });
  });

  it("returns 400 when note is missing", async () => {
    const req = { body: { candidateUsername: "jdoe" }, userDoc: recruiterUserDoc };
    await handleCreateInterest(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(RecruiterInterest.create).not.toHaveBeenCalled();
  });

  it("returns 400 when note is only whitespace", async () => {
    const req = { body: { candidateUsername: "jdoe", note: "   " }, userDoc: recruiterUserDoc };
    await handleCreateInterest(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 when note exceeds 500 characters", async () => {
    const req = { body: { candidateUsername: "jdoe", note: "x".repeat(501) }, userDoc: recruiterUserDoc };
    await handleCreateInterest(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringMatching(/500 characters/i) })
    );
  });

  it("returns 404 when the candidate doesn't exist", async () => {
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(null) });
    const req = { body: { candidateUsername: "ghost", note: "Hi there" }, userDoc: recruiterUserDoc };
    await handleCreateInterest(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(RecruiterInterest.create).not.toHaveBeenCalled();
  });

  it("returns 429 when this recruiter already reached out to this candidate within the cooldown", async () => {
    RecruiterInterest.findOne.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: "prior-interest" }),
    });
    const req = { body: { candidateUsername: "jdoe", note: "Second try" }, userDoc: recruiterUserDoc };
    await handleCreateInterest(req, res);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(RecruiterInterest.create).not.toHaveBeenCalled();
    expect(createNotification).not.toHaveBeenCalled();
  });

  it("creates the interest, notifies the candidate, and returns 201 on success", async () => {
    const req = {
      body: { candidateUsername: "jdoe", note: "  Loved your DP solutions.  " },
      userDoc: recruiterUserDoc,
    };
    await handleCreateInterest(req, res);

    expect(RecruiterInterest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        recruiterId: "recruiter1",
        recruiterCompany: "Acme Corp",
        candidateId: "candidate1",
        candidateUsername: "jdoe",
        note: "Loved your DP solutions.", // trimmed
      })
    );
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "candidate1",
        type: "recruiter_interest",
        link: "/profile",
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ interestId: "interest1" })
    );
  });

  it("still returns 201 (does not fail the request) if the notification itself rejects", async () => {
    createNotification.mockReturnValue(Promise.reject(new Error("notif service down")));
    const req = { body: { candidateUsername: "jdoe", note: "Hello" }, userDoc: recruiterUserDoc };

    await handleCreateInterest(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("returns 500 if an unexpected error is thrown (e.g. the User lookup itself fails)", async () => {
    User.findOne.mockImplementation(() => {
      throw new Error("Mongo down");
    });
    const req = { body: { candidateUsername: "jdoe", note: "Hello" }, userDoc: recruiterUserDoc };

    await handleCreateInterest(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});