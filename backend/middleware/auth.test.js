import { describe, expect, it, vi, beforeEach } from "vitest";

const verifyIdToken = vi.fn();

vi.mock("../config/firebaseAdmin.js", () => ({
  getFirebaseAdmin: () => ({ auth: () => ({ verifyIdToken }) }),
}));
vi.mock("../config/logger.js", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("../models/User.js", () => ({
  default: { findOne: vi.fn(), findById: vi.fn(), create: vi.fn() },
}));

import User from "../models/User.js";
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

function makeUserDoc(overrides = {}) {
  return {
    _id: "user1",
    role: "student",
    impersonating: { targetUserId: null, startedAt: null },
    save: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe("requireAuth", () => {
  let res;
  let next;

  beforeEach(() => {
    _clearUserAuthCacheForTests();
    vi.clearAllMocks();
    res = mockRes();
    next = vi.fn();
  });

  it("rejects a request with no Authorization header", async () => {
    const req = mockReq({ headers: {} });
    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects when Firebase token verification fails", async () => {
    verifyIdToken.mockRejectedValueOnce(new Error("bad token"));
    const req = mockReq();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("on a cache MISS, looks up the user in Mongo and caches the result", async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: "fb-1", email: "a@b.com" });
    const userDoc = makeUserDoc();
    User.findOne.mockResolvedValueOnce(userDoc);

    const req = mockReq();
    await requireAuth(req, res, next);

    expect(User.findOne).toHaveBeenCalledWith({ firebaseUid: "fb-1" });
    expect(req.userDoc).toBe(userDoc);
    expect(next).toHaveBeenCalledOnce();
  });

  it("creates a new User document the first time a Firebase UID is seen", async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: "fb-new", email: "new@b.com", name: "New" });
    User.findOne.mockResolvedValueOnce(null);
    const created = makeUserDoc({ _id: "user-new" });
    User.create.mockResolvedValueOnce(created);

    const req = mockReq();
    await requireAuth(req, res, next);

    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ firebaseUid: "fb-new", email: "new@b.com" })
    );
    expect(req.userDoc).toBe(created);
    expect(next).toHaveBeenCalledOnce();
  });

  it("on a cache HIT, skips Mongo entirely for the same Firebase UID", async () => {
    verifyIdToken.mockResolvedValue({ uid: "fb-1", email: "a@b.com" });
    const userDoc = makeUserDoc();
    User.findOne.mockResolvedValueOnce(userDoc);

    // First request: MISS, populates the cache.
    await requireAuth(mockReq(), res, next);
    expect(User.findOne).toHaveBeenCalledTimes(1);

    // Second request, same UID: HIT, no additional Mongo call.
    const req2 = mockReq();
    await requireAuth(req2, res, next);

    expect(User.findOne).toHaveBeenCalledTimes(1);
    expect(req2.userDoc).toBe(userDoc);
  });

  it("a mutation + save() on a cache HIT is visible on the very next HIT (same reference)", async () => {
    verifyIdToken.mockResolvedValue({ uid: "fb-1", email: "a@b.com" });
    const userDoc = makeUserDoc();
    User.findOne.mockResolvedValueOnce(userDoc);

    await requireAuth(mockReq(), res, next);

    // Simulate a downstream route mutating req.userDoc and saving it.
    userDoc.role = "recruiter";
    await userDoc.save();

    const req2 = mockReq();
    await requireAuth(req2, res, next);

    expect(req2.userDoc.role).toBe("recruiter");
    expect(User.findOne).toHaveBeenCalledTimes(1);
  });

  it("swaps req.userDoc to the impersonation target and sets req.actingAdminDoc", async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: "fb-admin", email: "admin@b.com" });
    const adminDoc = makeUserDoc({
      _id: "admin1",
      role: "admin",
      impersonating: { targetUserId: "target1", startedAt: new Date() },
    });
    const targetDoc = makeUserDoc({ _id: "target1", role: "student" });

    User.findOne.mockResolvedValueOnce(adminDoc);
    User.findById.mockResolvedValueOnce(targetDoc);

    const req = mockReq();
    await requireAuth(req, res, next);

    expect(req.userDoc).toBe(targetDoc);
    expect(req.actingAdminDoc).toBe(adminDoc);
    expect(next).toHaveBeenCalledOnce();
  });

  it("caches the impersonation target by id, skipping Mongo on the next request", async () => {
    verifyIdToken.mockResolvedValue({ uid: "fb-admin", email: "admin@b.com" });
    const adminDoc = makeUserDoc({
      _id: "admin1",
      role: "admin",
      impersonating: { targetUserId: "target1", startedAt: new Date() },
    });
    const targetDoc = makeUserDoc({ _id: "target1", role: "student" });

    User.findOne.mockResolvedValueOnce(adminDoc); // first request only (then cached)
    User.findById.mockResolvedValueOnce(targetDoc); // first request only (then cached)

    await requireAuth(mockReq(), res, next);
    expect(User.findById).toHaveBeenCalledTimes(1);

    const req2 = mockReq();
    await requireAuth(req2, res, next);

    expect(User.findById).toHaveBeenCalledTimes(1);
    expect(req2.userDoc).toBe(targetDoc);
    expect(req2.actingAdminDoc).toBe(adminDoc);
  });

  it("clears a stale impersonation pointer when the target no longer exists", async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: "fb-admin", email: "admin@b.com" });
    const adminDoc = makeUserDoc({
      _id: "admin1",
      role: "admin",
      impersonating: { targetUserId: "deleted-user", startedAt: new Date() },
    });

    User.findOne.mockResolvedValueOnce(adminDoc);
    User.findById.mockResolvedValueOnce(null);

    const req = mockReq();
    await requireAuth(req, res, next);

    expect(adminDoc.impersonating).toEqual({ targetUserId: null, startedAt: null });
    expect(adminDoc.save).toHaveBeenCalledOnce();
    expect(req.userDoc).toBe(adminDoc);
    expect(req.actingAdminDoc).toBeNull();
    expect(next).toHaveBeenCalledOnce();
  });

  it("continues with req.userDoc = null if Mongo is unavailable, rather than failing the request", async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: "fb-1", email: "a@b.com" });
    User.findOne.mockRejectedValueOnce(new Error("Mongo down"));

    const req = mockReq();
    await requireAuth(req, res, next);

    expect(req.userDoc).toBeNull();
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  // ── Suspension enforcement (plan 003) ─────────────────────────────────
  describe("suspended-account enforcement", () => {
    it("rejects a suspended non-admin user's own request with 403", async () => {
      verifyIdToken.mockResolvedValueOnce({ uid: "fb-1", email: "a@b.com" });
      const userDoc = makeUserDoc({ role: "student", status: "suspended" });
      User.findOne.mockResolvedValueOnce(userDoc);

      const req = mockReq();
      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it("does not block an active (non-suspended) user", async () => {
      verifyIdToken.mockResolvedValueOnce({ uid: "fb-1", email: "a@b.com" });
      const userDoc = makeUserDoc({ role: "student", status: "active" });
      User.findOne.mockResolvedValueOnce(userDoc);

      const req = mockReq();
      await requireAuth(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledOnce();
    });

    it("never blocks an admin account, even if status were somehow 'suspended'", async () => {
      verifyIdToken.mockResolvedValueOnce({ uid: "fb-admin", email: "admin@b.com" });
      const adminDoc = makeUserDoc({ _id: "admin1", role: "admin", status: "suspended" });
      User.findOne.mockResolvedValueOnce(adminDoc);

      const req = mockReq();
      await requireAuth(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledOnce();
    });

    it("does not lock an admin out of their own impersonation session, even if the impersonated target is suspended", async () => {
      verifyIdToken.mockResolvedValueOnce({ uid: "fb-admin", email: "admin@b.com" });
      const adminDoc = makeUserDoc({
        _id: "admin1",
        role: "admin",
        impersonating: { targetUserId: "target1", startedAt: new Date() },
      });
      const suspendedTarget = makeUserDoc({ _id: "target1", role: "student", status: "suspended" });

      User.findOne.mockResolvedValueOnce(adminDoc);
      User.findById.mockResolvedValueOnce(suspendedTarget);

      const req = mockReq();
      await requireAuth(req, res, next);

      // req.actingAdminDoc is set (this is an impersonation request), so the
      // suspension check is skipped — see auth.js's comment for why: without
      // this, the admin could never call stop-impersonate on this target again.
      expect(req.actingAdminDoc).toBe(adminDoc);
      expect(req.userDoc).toBe(suspendedTarget);
      expect(res.status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledOnce();
    });
  });
});