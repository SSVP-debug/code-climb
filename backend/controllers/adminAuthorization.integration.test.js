import { describe, expect, it, vi, beforeAll, beforeEach, afterEach, afterAll } from "vitest";
import { startTestMongo, clearTestMongo, stopTestMongo } from "../test/mongoMemoryServer.js";

// ── P0 workflows: Admin authorization + impersonation ─────────────────────
//
// Admin authorization matrix (student/recruiter/tpo → 403, admin → allowed)
// exercised via the real requireAdmin middleware against real User roles.
// Impersonation is driven through the REAL requireAuth middleware (mocked
// Firebase boundary only) so req.userDoc / req.actingAdminDoc are exactly
// what production requests would see — not hand-constructed to match what
// the test expects.

const verifyIdToken = vi.fn();

vi.mock("../config/firebaseAdmin.js", () => ({
  getFirebaseAdmin: () => ({ auth: () => ({ verifyIdToken }) }),
}));

const { requireAuth } = await import("../middleware/auth.js");
const { requireAdmin } = await import("../middleware/roleGuard.js");
const { startImpersonation, stopImpersonation, getPendingQueue } = await import("../controllers/adminController.js");
const { _clearUserAuthCacheForTests } = await import("../utils/userAuthCache.js");
const { default: User } = await import("../models/User.js");
const { default: ImpersonationLog } = await import("../models/ImpersonationLog.js");

function mockRes() {
  const res = {};
  res._status = 200;
  res._json = null;
  res.status = vi.fn((c) => { res._status = c; return res; });
  res.json = vi.fn((b) => { res._json = b; return res; });
  return res;
}

function mockLog() {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

async function authenticate(uid, email) {
  verifyIdToken.mockResolvedValueOnce({ uid, email });
  const req = { headers: { authorization: "Bearer t" }, log: mockLog() };
  const res = mockRes();
  const next = vi.fn();
  await requireAuth(req, res, next);
  return { req, res, next };
}

describe("Admin authorization matrix (real Mongo)", () => {
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

  it("denies a student", async () => {
    const student = await User.create({ firebaseUid: "fb-s1", email: "s1@test.com" });
    const res = mockRes();
    await requireAdmin({ userDoc: student }, res, vi.fn());
    expect(res._status).toBe(403);
  });

  it("denies a recruiter, even a verified one", async () => {
    const recruiter = await User.create({
      firebaseUid: "fb-r1",
      email: "r1@test.com",
      role: "recruiter",
      recruiterProfile: { companyName: "Co", designation: "R", companyDomain: "co.com", verified: true, verifiedAt: new Date() },
    });
    const res = mockRes();
    await requireAdmin({ userDoc: recruiter }, res, vi.fn());
    expect(res._status).toBe(403);
  });

  it("denies a TPO, even a verified one", async () => {
    const tpo = await User.create({
      firebaseUid: "fb-t1",
      email: "t1@test.com",
      role: "tpo",
      tpoProfile: { collegeDomain: "c.ac.in", collegeName: "C", verified: true, verifiedAt: new Date() },
    });
    const res = mockRes();
    await requireAdmin({ userDoc: tpo }, res, vi.fn());
    expect(res._status).toBe(403);
  });

  it("allows an admin, and the real getPendingQueue handler runs against real Mongo", async () => {
    const admin = await User.create({ firebaseUid: "fb-a1", email: "a1@test.com", role: "admin" });
    const guardRes = mockRes();
    const next = vi.fn();
    await requireAdmin({ userDoc: admin }, guardRes, next);
    expect(next).toHaveBeenCalledOnce();

    const res = mockRes();
    await getPendingQueue({ userDoc: admin }, res);
    expect(res._status).toBe(200);
    expect(res._json).toHaveProperty("recruiters");
  });
});

describe("Admin impersonation — full workflow through real requireAuth (real Mongo)", () => {
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

  it("start → effective context swap → admin identity preserved → exit → restored, all through real requireAuth", async () => {
    const admin = await User.create({ firebaseUid: "fb-admin-x", email: "adminx@test.com", role: "admin" });
    const target = await User.create({ firebaseUid: "fb-target-x", email: "targetx@test.com", role: "student", displayName: "Target" });

    // 1) Admin authenticates normally, calls startImpersonation for real.
    const { req: adminReq } = await authenticate("fb-admin-x", "adminx@test.com");
    expect(adminReq.userDoc._id.toString()).toBe(admin._id.toString());
    expect(adminReq.actingAdminDoc).toBeNull();

    await startImpersonation({ params: { userId: target._id.toString() }, userDoc: adminReq.userDoc, actingAdminDoc: null, log: mockLog() }, mockRes());

    const reloadedAdmin = await User.findById(admin._id);
    expect(reloadedAdmin.impersonating.targetUserId.toString()).toBe(target._id.toString());

    const logEntry = await ImpersonationLog.findOne({ adminId: admin._id, targetUserId: target._id });
    expect(logEntry).toBeTruthy();
    expect(logEntry.endedAt).toBeNull();

    // 2) The ADMIN's very next authenticated request (fresh Firebase
    // token, same admin uid) must transparently resolve req.userDoc to
    // the TARGET, while req.actingAdminDoc stays the real admin — this
    // is the actual "effective context" mechanism, driven through real
    // requireAuth, not asserted by hand.
    _clearUserAuthCacheForTests();
    const { req: impersonatedReq } = await authenticate("fb-admin-x", "adminx@test.com");
    expect(impersonatedReq.userDoc._id.toString()).toBe(target._id.toString());
    expect(impersonatedReq.actingAdminDoc._id.toString()).toBe(admin._id.toString());

    // 3) Admin-only routes must stay reachable during impersonation via
    // req.actingAdminDoc — a plain requireRole("admin") would have
    // rejected this since req.userDoc.role is now "student".
    const guardRes = mockRes();
    const next = vi.fn();
    await requireAdmin(impersonatedReq, guardRes, next);
    expect(next).toHaveBeenCalledOnce();
    expect(guardRes._status).toBe(200); // untouched — no rejection happened

    // 4) Exit impersonation.
    await stopImpersonation({ userDoc: impersonatedReq.userDoc, actingAdminDoc: impersonatedReq.actingAdminDoc, log: mockLog() }, mockRes());

    const closedLog = await ImpersonationLog.findOne({ adminId: admin._id, targetUserId: target._id });
    expect(closedLog.endedAt).toBeTruthy();

    const finalAdmin = await User.findById(admin._id);
    expect(finalAdmin.impersonating.targetUserId).toBeNull();

    // 5) The admin's NEXT request after exiting resolves back to their
    // own identity, not the target's.
    _clearUserAuthCacheForTests();
    const { req: restoredReq } = await authenticate("fb-admin-x", "adminx@test.com");
    expect(restoredReq.userDoc._id.toString()).toBe(admin._id.toString());
    expect(restoredReq.actingAdminDoc).toBeNull();
  });

  it("an admin cannot impersonate another admin", async () => {
    const admin = await User.create({ firebaseUid: "fb-admin-y", email: "adminy@test.com", role: "admin" });
    const otherAdmin = await User.create({ firebaseUid: "fb-admin-z", email: "adminz@test.com", role: "admin" });

    const res = mockRes();
    await startImpersonation({ params: { userId: otherAdmin._id.toString() }, userDoc: admin, actingAdminDoc: null, log: mockLog() }, res);

    expect(res._status).toBe(400);
    const reloaded = await User.findById(admin._id);
    expect(reloaded.impersonating.targetUserId).toBeNull();
  });

  it("an admin impersonating a suspended user is not locked out — they can still act and exit", async () => {
    const admin = await User.create({ firebaseUid: "fb-admin-w", email: "adminw@test.com", role: "admin" });
    const suspendedTarget = await User.create({ firebaseUid: "fb-target-w", email: "targetw@test.com", role: "student", status: "suspended" });

    await startImpersonation({ params: { userId: suspendedTarget._id.toString() }, userDoc: admin, actingAdminDoc: null, log: mockLog() }, mockRes());

    _clearUserAuthCacheForTests();
    const { req, res } = await authenticate("fb-admin-w", "adminw@test.com");
    // Must NOT be 403'd despite the target being suspended — the
    // req.actingAdminDoc exemption in requireAuth is what's under test.
    expect(res._status).toBe(200);
    expect(req.userDoc._id.toString()).toBe(suspendedTarget._id.toString());
    expect(req.actingAdminDoc._id.toString()).toBe(admin._id.toString());
  });

  it("the suspended target's OWN (non-impersonated) request is still rejected", async () => {
    const admin = await User.create({ firebaseUid: "fb-admin-v", email: "adminv@test.com", role: "admin" });
    const suspendedTarget = await User.create({ firebaseUid: "fb-target-v", email: "targetv@test.com", role: "student", status: "suspended" });

    await startImpersonation({ params: { userId: suspendedTarget._id.toString() }, userDoc: admin, actingAdminDoc: null, log: mockLog() }, mockRes());

    // The suspended user logging in on their OWN device, not the admin.
    _clearUserAuthCacheForTests();
    const { res } = await authenticate("fb-target-v", "targetv@test.com");
    expect(res._status).toBe(403);
  });
});