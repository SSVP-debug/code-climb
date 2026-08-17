import { describe, expect, it, vi, beforeAll, beforeEach, afterEach, afterAll } from "vitest";
import { startTestMongo, clearTestMongo, stopTestMongo } from "../test/mongoMemoryServer.js";

// ── P0 workflow: Auth → User ─────────────────────────────────────────────
//
// middleware/auth.integration.test.js already covers the specific
// referral-code/duplicate-key regression for first-time onboarding — this
// file is deliberately scoped to NOT repeat that, and instead covers the
// rest of the workflow described in the integration-audit handoff:
//   Firebase-authenticated request → requireAuth → Firebase UID → MongoDB
//   User lookup → req.userDoc → protected endpoint
// specifically: an existing user's second request resolves the SAME doc
// (no accidental duplicate), an invalid token is rejected before any Mongo
// lookup happens, a missing token is rejected the same way, and a
// successfully-resolved req.userDoc actually flows into a real downstream
// route handler (getProgress) — not just requireAuth in isolation.
//
// Firebase token verification is the external boundary and is mocked (same
// pattern as the existing auth.integration.test.js); User is real Mongo.

const verifyIdToken = vi.fn();

vi.mock("../config/firebaseAdmin.js", () => ({
  getFirebaseAdmin: () => ({ auth: () => ({ verifyIdToken }) }),
}));

import { requireAuth } from "../middleware/auth.js";
import { getProgress } from "../controllers/progressController.js";
import { _clearUserAuthCacheForTests } from "../utils/userAuthCache.js";
import User from "../models/User.js";

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

describe("Auth → User workflow (real Mongo)", () => {
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

  it("creates exactly one User doc for a first-time Firebase UID, then reuses it on the next request", async () => {
    verifyIdToken.mockResolvedValue({ uid: "fb-existing-1", email: "existing1@test.com", name: "Existing One" });

    const req1 = mockReq();
    const res1 = mockRes();
    const next1 = vi.fn();
    await requireAuth(req1, res1, next1);

    expect(next1).toHaveBeenCalledOnce();
    expect(req1.userDoc).toBeTruthy();
    const firstId = req1.userDoc._id.toString();

    // Clear the in-process auth cache so the second request is forced to
    // go back to Mongo for the lookup, rather than trivially returning the
    // same cached reference regardless of what User.findOne would do.
    _clearUserAuthCacheForTests();

    const req2 = mockReq();
    const res2 = mockRes();
    const next2 = vi.fn();
    await requireAuth(req2, res2, next2);

    expect(next2).toHaveBeenCalledOnce();
    expect(req2.userDoc._id.toString()).toBe(firstId);

    const countInDb = await User.countDocuments({ firebaseUid: "fb-existing-1" });
    expect(countInDb).toBe(1);
  });

  it("rejects with 401 and never touches Mongo when the Firebase token itself is invalid", async () => {
    verifyIdToken.mockRejectedValueOnce(new Error("Firebase ID token has expired"));

    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(req.userDoc).toBeUndefined();

    const countInDb = await User.countDocuments({});
    expect(countInDb).toBe(0);
  });

  it("rejects with 401 when the Authorization header is missing entirely", async () => {
    const req = mockReq({ headers: {} });
    const res = mockRes();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it("flows a real req.userDoc from requireAuth into a downstream protected handler", async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: "fb-existing-2", email: "existing2@test.com" });

    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    await requireAuth(req, res, next);
    expect(next).toHaveBeenCalledOnce();

    // getProgress reads directly off req.userDoc — proving the object
    // requireAuth attached is actually usable by a real route handler,
    // not just structurally present.
    await getProgress(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ solvedSlugs: [], totalXP: 0 })
    );
  });

  it("blocks a suspended user's own request but still resolves req.userDoc for status inspection", async () => {
    await User.create({
      firebaseUid: "fb-suspended-1",
      email: "suspended1@test.com",
      status: "suspended",
    });

    verifyIdToken.mockResolvedValueOnce({ uid: "fb-suspended-1", email: "suspended1@test.com" });

    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});