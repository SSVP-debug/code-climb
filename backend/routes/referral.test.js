import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/User.js", () => ({
  default: { exists: vi.fn(), findOne: vi.fn(), countDocuments: vi.fn() },
}));
vi.mock("../models/ReferralQualification.js", () => ({
  default: { create: vi.fn(), countDocuments: vi.fn() },
}));
vi.mock("../services/userSubscriptionService.js", () => ({
  saveSubscription: vi.fn().mockResolvedValue({ acknowledged: true }),
  saveSubscriptionIfMatch: vi.fn(),
}));
vi.mock("../services/referralQualification.js", () => ({
  createReferralAssociationQualification: vi.fn(),
}));
vi.mock("../config/featureFlags.js", () => ({ REFERRAL_REWARD_DAYS: 7 }));
vi.mock("../config/site.js", () => ({ SITE_URL: "https://example.test" }));

import User from "../models/User.js";
import ReferralQualification from "../models/ReferralQualification.js";
import { saveSubscription, saveSubscriptionIfMatch } from "../services/userSubscriptionService.js";
import { createReferralAssociationQualification } from "../services/referralQualification.js";
import referralRouter, { getOrCreateReferralCode } from "./referral.js";

// referral.js doesn't export /apply or /stats individually — pull them off
// the real router's stack, same convention as routes/battleRooms.test.js
// and routes/contests.test.js. This exercises the actual handler code.
function getHandler(method, path) {
  const layer = referralRouter.stack.find(
    (l) => l.route && l.route.path === path && l.route.methods[method]
  );
  if (!layer) throw new Error(`No ${method.toUpperCase()} route registered for path ${path}`);
  return layer.route.stack[layer.route.stack.length - 1].handle;
}

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockLog() {
  return { error: vi.fn(), warn: vi.fn() };
}

describe("getOrCreateReferralCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the existing code without writing anything if already set", async () => {
    const userDoc = { _id: "u1", referralCode: "already-set" };

    const code = await getOrCreateReferralCode(userDoc);

    expect(code).toBe("already-set");
    expect(saveSubscription).not.toHaveBeenCalled();
  });

  it("generates a code, dual-writes it via saveSubscription, and syncs it onto the in-memory doc", async () => {
    User.exists.mockResolvedValueOnce(false); // first generated code is unique
    const userDoc = { _id: "u1", displayName: "Ada Lovelace", referralCode: null };

    const code = await getOrCreateReferralCode(userDoc);

    expect(code).toBeTruthy();
    expect(saveSubscription).toHaveBeenCalledWith("u1", { referralCode: code });
    // Local doc must reflect the write immediately — this is the object the
    // short-TTL requireAuth cache (utils/userAuthCache.js) hands back to
    // subsequent requests on this instance, so it can't be left stale.
    expect(userDoc.referralCode).toBe(code);
  });

  it("retries code generation on collision, up to 5 attempts", async () => {
    User.exists
      .mockResolvedValueOnce(true) // collision
      .mockResolvedValueOnce(true) // collision
      .mockResolvedValueOnce(false); // unique
    const userDoc = { _id: "u1", displayName: "Grace Hopper", referralCode: null };

    await getOrCreateReferralCode(userDoc);

    expect(User.exists).toHaveBeenCalledTimes(3);
    expect(saveSubscription).toHaveBeenCalledOnce();
  });
});

describe("POST /apply — atomic association (race-condition fix) + Referral Qualification tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function baseReq(overrides = {}) {
    return {
      body: { code: "abc123" },
      userDoc: { _id: "user1", referralCode: "own-code", referredBy: null },
      log: mockLog(),
      ...overrides,
    };
  }

  it("uses an atomic conditional update (saveSubscriptionIfMatch), not a plain write, to set referredBy", async () => {
    const handler = getHandler("post", "/apply");
    const referrer = { _id: "referrer1", referralCode: "abc123" };
    const req = baseReq();
    const res = mockRes();
    User.findOne.mockResolvedValueOnce(referrer);
    saveSubscriptionIfMatch.mockResolvedValueOnce({ _id: "user1", referredBy: "abc123" });
    createReferralAssociationQualification.mockResolvedValueOnce({ _id: "qual1" });

    await handler(req, res);

    expect(saveSubscriptionIfMatch).toHaveBeenCalledWith(
      "user1",
      { referredBy: null },
      { referredBy: "abc123" }
    );
    expect(saveSubscription).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("returns 400 without creating a qualification row when the atomic update loses the race (concurrent /apply)", async () => {
    const handler = getHandler("post", "/apply");
    const referrer = { _id: "referrer1", referralCode: "abc123" };
    const req = baseReq();
    const res = mockRes();
    User.findOne.mockResolvedValueOnce(referrer);
    // null = a concurrent request already set referredBy first — this
    // request's precondition (`referredBy: null`) no longer matches.
    saveSubscriptionIfMatch.mockResolvedValueOnce(null);

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(createReferralAssociationQualification).not.toHaveBeenCalled();
  });

  it("rejects a duplicate /apply on an account that already has referredBy set (fast-path pre-check)", async () => {
    const handler = getHandler("post", "/apply");
    const req = baseReq({ userDoc: { _id: "user1", referralCode: "own-code", referredBy: "already-set" } });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(saveSubscriptionIfMatch).not.toHaveBeenCalled();
  });

  it("rejects self-referral server-side and never attempts the association write", async () => {
    const handler = getHandler("post", "/apply");
    const req = baseReq({ body: { code: "own-code" } });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(saveSubscriptionIfMatch).not.toHaveBeenCalled();
    expect(createReferralAssociationQualification).not.toHaveBeenCalled();
  });

  it("returns 404 for an invalid referral code and never attempts the association write", async () => {
    const handler = getHandler("post", "/apply");
    const req = baseReq({ body: { code: "nonexistent" } });
    const res = mockRes();
    User.findOne.mockResolvedValueOnce(null);

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(saveSubscriptionIfMatch).not.toHaveBeenCalled();
  });

  it("delegates ReferralQualification creation to createReferralAssociationQualification (the service), not a raw model call", async () => {
    const handler = getHandler("post", "/apply");
    const referrer = { _id: "referrer1", referralCode: "abc123" };
    const req = baseReq();
    const res = mockRes();
    User.findOne.mockResolvedValueOnce(referrer);
    saveSubscriptionIfMatch.mockResolvedValueOnce({ _id: "user1", referredBy: "abc123" });
    createReferralAssociationQualification.mockResolvedValueOnce({ _id: "qual1" });

    await handler(req, res);

    expect(createReferralAssociationQualification).toHaveBeenCalledWith({
      referrerId: "referrer1",
      referredUserId: "user1",
      referralCodeUsed: "abc123",
    });
  });

  it("does not undo the referredBy association if createReferralAssociationQualification fails unexpectedly", async () => {
    const handler = getHandler("post", "/apply");
    const referrer = { _id: "referrer1", referralCode: "abc123" };
    const req = baseReq();
    const res = mockRes();
    User.findOne.mockResolvedValueOnce(referrer);
    saveSubscriptionIfMatch.mockResolvedValueOnce({ _id: "user1", referredBy: "abc123" });
    createReferralAssociationQualification.mockRejectedValueOnce(new Error("connection lost"));

    await handler(req, res);

    // The primary referral association (saveSubscriptionIfMatch) already
    // succeeded above this point — a qualification-tracking failure must
    // not turn a successful /apply into an error response.
    expect(res.status).not.toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(req.log.error).toHaveBeenCalled();
  });

  it("silently ignores a duplicate-key error from createReferralAssociationQualification (race with a concurrent /apply)", async () => {
    const handler = getHandler("post", "/apply");
    const referrer = { _id: "referrer1", referralCode: "abc123" };
    const req = baseReq();
    const res = mockRes();
    User.findOne.mockResolvedValueOnce(referrer);
    saveSubscriptionIfMatch.mockResolvedValueOnce({ _id: "user1", referredBy: "abc123" });
    const dupError = Object.assign(new Error("E11000 duplicate key"), { code: 11000 });
    createReferralAssociationQualification.mockRejectedValueOnce(dupError);

    await handler(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    // Not logged as an error — this is an expected, benign race outcome.
    expect(req.log.error).not.toHaveBeenCalled();
  });
});

describe("GET /stats — qualifiedCount (Plan 2, additive)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns qualifiedCount alongside the existing referredCount/rewardDaysEarned", async () => {
    const handler = getHandler("get", "/stats");
    const req = {
      userDoc: { _id: "user1", referralCode: "abc123", referralRewardDays: 14 },
    };
    const res = mockRes();
    User.countDocuments.mockResolvedValueOnce(5);
    ReferralQualification.countDocuments.mockResolvedValueOnce(2);

    await handler(req, res);

    expect(ReferralQualification.countDocuments).toHaveBeenCalledWith({
      referrerId: "user1",
      status: "qualified",
    });
    expect(res.json).toHaveBeenCalledWith({
      referredCount: 5,
      rewardDaysEarned: 14,
      qualifiedCount: 2,
    });
  });

  it("returns qualifiedCount: 0 when the user has no referral code yet", async () => {
    const handler = getHandler("get", "/stats");
    const req = { userDoc: { _id: "user1", referralCode: null } };
    const res = mockRes();

    await handler(req, res);

    expect(res.json).toHaveBeenCalledWith({ referredCount: 0, rewardDaysEarned: 0, qualifiedCount: 0 });
    expect(ReferralQualification.countDocuments).not.toHaveBeenCalled();
  });
});
