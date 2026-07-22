import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../config/featureFlags.js", () => ({
  B2B_ENABLED: true,
}));
vi.mock("../models/User.js", () => ({
  default: { find: vi.fn() },
}));
vi.mock("../models/Assignment.js", () => ({
  default: { findOne: vi.fn() },
}));
vi.mock("../services/notificationService.js", () => ({
  createNotificationBulk: vi.fn().mockResolvedValue(undefined),
}));

import User from "../models/User.js";
import Assignment from "../models/Assignment.js";
import { createNotificationBulk } from "../services/notificationService.js";
import { handleRemindAssignment } from "./tpo.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const tpoUserDoc = { tpoProfile: { collegeDomain: "example.edu" } };

const assignmentDoc = {
  _id: "assignment1",
  title: "Week 3 — Arrays",
  dueDate: "2026-08-01",
  problemSlugs: ["two-sum", "valid-parentheses"],
};

describe("handleRemindAssignment", () => {
  let res;

  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
    Assignment.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(assignmentDoc) });
  });

  it("returns 400 when the TPO account has no college domain set", async () => {
    const req = { params: { id: "assignment1" }, userDoc: { tpoProfile: {} } };
    await handleRemindAssignment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(createNotificationBulk).not.toHaveBeenCalled();
  });

  it("returns 404 when the assignment doesn't exist for this college", async () => {
    Assignment.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
    const req = { params: { id: "ghost" }, userDoc: tpoUserDoc };
    await handleRemindAssignment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("only notifies students who haven't completed every problem in the assignment", async () => {
    User.find.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: "student-done", solvedSlugs: ["two-sum", "valid-parentheses"] },
          { _id: "student-partial", solvedSlugs: ["two-sum"] },
          { _id: "student-none", solvedSlugs: [] },
        ]),
      }),
    });
    const req = { params: { id: "assignment1" }, userDoc: tpoUserDoc };

    await handleRemindAssignment(req, res);

    expect(createNotificationBulk).toHaveBeenCalledWith(
      ["student-partial", "student-none"],
      expect.objectContaining({ type: "assignment_reminder" })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ remindedCount: 2 })
    );
  });

  it("short-circuits with remindedCount: 0 and does not call createNotificationBulk when everyone is done", async () => {
    User.find.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: "student-done", solvedSlugs: ["two-sum", "valid-parentheses"] },
        ]),
      }),
    });
    const req = { params: { id: "assignment1" }, userDoc: tpoUserDoc };

    await handleRemindAssignment(req, res);

    expect(createNotificationBulk).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ remindedCount: 0 })
    );
  });

  it("returns 500 if an unexpected error is thrown", async () => {
    User.find.mockImplementation(() => {
      throw new Error("Mongo down");
    });
    const req = { params: { id: "assignment1" }, userDoc: tpoUserDoc };

    await handleRemindAssignment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});