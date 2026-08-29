import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../services/referralQualification.js", () => ({
  retryPendingReferralRewards: vi.fn(),
}));
vi.mock("../services/adminAuditLog.js", () => ({
  recordAdminAction: vi.fn(),
}));

import { retryPendingReferralRewards } from "../services/referralQualification.js";
import { recordAdminAction } from "../services/adminAuditLog.js";
import { retryReferralRewards } from "./adminReferralController.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockAdmin() {
  return { _id: "admin1", email: "admin@codeclub.in", role: "admin" };
}

describe("adminReferralController.js — retryReferralRewards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the reconciliation service and returns its result", async () => {
    retryPendingReferralRewards.mockResolvedValueOnce({ attempted: 3, issued: 2, stillUnissued: 1 });
    const req = { body: {}, userDoc: mockAdmin(), log: { error: vi.fn() } };
    const res = mockRes();

    await retryReferralRewards(req, res);

    expect(retryPendingReferralRewards).toHaveBeenCalledWith({});
    expect(res.json).toHaveBeenCalledWith({ attempted: 3, issued: 2, stillUnissued: 1 });
  });

  it("passes through a custom limit from the request body", async () => {
    retryPendingReferralRewards.mockResolvedValueOnce({ attempted: 0, issued: 0, stillUnissued: 0 });
    const req = { body: { limit: 25 }, userDoc: mockAdmin(), log: { error: vi.fn() } };
    const res = mockRes();

    await retryReferralRewards(req, res);

    expect(retryPendingReferralRewards).toHaveBeenCalledWith({ limit: 25 });
  });

  it("records an admin audit action with the reconciliation result", async () => {
    retryPendingReferralRewards.mockResolvedValueOnce({ attempted: 1, issued: 1, stillUnissued: 0 });
    const req = { body: {}, userDoc: mockAdmin(), log: { error: vi.fn() } };
    const res = mockRes();

    await retryReferralRewards(req, res);

    expect(recordAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        adminDoc: mockAdmin(),
        action: "referral.retry_rewards",
        targetType: "ReferralQualification",
        details: { attempted: 1, issued: 1, stillUnissued: 0 },
      })
    );
  });

  it("returns 500 without throwing if the reconciliation service errors", async () => {
    retryPendingReferralRewards.mockRejectedValueOnce(new Error("db down"));
    const req = { body: {}, userDoc: mockAdmin(), log: { error: vi.fn() } };
    const res = mockRes();

    await retryReferralRewards(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(req.log.error).toHaveBeenCalled();
  });
});
