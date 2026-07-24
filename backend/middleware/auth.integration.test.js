import { describe, expect, it, vi, beforeAll, beforeEach, afterEach, afterAll } from "vitest";
import { startTestMongo, clearTestMongo, stopTestMongo } from "../test/mongoMemoryServer.js";

const verifyIdToken = vi.fn();

vi.mock("../config/firebaseAdmin.js", () => ({
  getFirebaseAdmin: () => ({ auth: () => ({ verifyIdToken }) }),
}));

import { requireAuth } from "./auth.js";
import { _clearUserAuthCacheForTests } from "../utils/userAuthCache.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockLog() {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

function mockReq(overrides = {}) {
  return {
    headers: { authorization: "Bearer good-token" },
    log: mockLog(),
    ...overrides,
  };
}

describe("requireAuth — first-time user onboarding against real Mongo", () => {
  beforeAll(async () => {
    await startTestMongo();
  }, 60_000);

  beforeEach(() => {
    _clearUserAuthCacheForTests();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await clearTestMongo();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  it("creates a real Mongo user doc on first login with no referralCode field, and no duplicate-key error", async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: "fb-new-1", email: "new1@test.com", name: "New One" });

    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.userDoc).toBeTruthy();
    expect(req.userDoc.referralCode).toBeUndefined();
  });

  it("onboards two different first-time users back-to-back without a duplicate-key collision", async () => {
    // This is the exact failure mode from the incident: user A succeeds,
    // user B's User.create throws E11000, the middleware's catch block
    // swallows it and sets req.userDoc = null, and B's request silently
    // degrades instead of failing loudly.
    verifyIdToken.mockResolvedValueOnce({ uid: "fb-new-2", email: "new2@test.com" });
    const reqA = mockReq();
    const resA = mockRes();
    const nextA = vi.fn();
    await requireAuth(reqA, resA, nextA);

    verifyIdToken.mockResolvedValueOnce({ uid: "fb-new-3", email: "new3@test.com" });
    const reqB = mockReq();
    const resB = mockRes();
    const nextB = vi.fn();
    await requireAuth(reqB, resB, nextB);

    expect(reqA.userDoc).toBeTruthy();
    expect(reqB.userDoc).toBeTruthy();
    expect(reqB.userDoc).not.toBeNull(); // the exact assertion that would have caught the original bug
  });
});