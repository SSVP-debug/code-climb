import { describe, expect, it, vi, beforeAll, afterEach, afterAll } from "vitest";
import { startTestMongo, clearTestMongo, stopTestMongo } from "../test/mongoMemoryServer.js";

// ── P0 workflow: TPO registration → pending → verification → TPO-only ────
// ── endpoint ────────────────────────────────────────────────────────────
//
// TPO routes are gated behind B2B_ENABLED, a module-load-time constant
// (config/featureFlags.js), so it must be set before tpo.js is first
// imported anywhere in this file's module graph.
process.env.B2B_ENABLED = "true";

const { default: tpoRouter } = await import("./tpo.js");
const { default: User } = await import("../models/User.js");
const { default: College } = await import("../models/College.js");
const { requireRole } = await import("../middleware/roleGuard.js");
const { requireVerified } = await import("../middleware/requireVerified.js");
const { approveTpo, rejectTpo } = await import("../controllers/adminController.js");

function extractRegisterHandler() {
  const layer = tpoRouter.stack.find(
    (l) => l.route && l.route.path === "/register" && l.route.methods.post
  );
  return layer.route.stack[0].handle;
}
const registerHandler = extractRegisterHandler();

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

async function seedStudent(overrides = {}) {
  return User.create({
    firebaseUid: `fb-${Math.random().toString(36).slice(2)}`,
    email: "tposignup1@unrecognized-college.ac.in",
    ...overrides,
  });
}

async function runTpoOnlyGate(req) {
  let blocked = false;
  const res = mockRes();
  const next = () => {};
  const guardedRes = new Proxy(res, {
    get(t, p) {
      if (p === "status") blocked = true;
      return t[p];
    },
  });
  await requireRole("tpo", "admin")(req, guardedRes, next);
  if (blocked) return "role";
  blocked = false;
  await requireVerified(req, guardedRes, next);
  if (blocked) return "verification";
  return "allowed";
}

describe("TPO registration → pending → verification → TPO-only endpoint (real Mongo)", () => {
  beforeAll(async () => {
    await startTestMongo();
  }, 60_000);

  afterEach(async () => {
    await clearTestMongo();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  it("registers a real TPO as pending for an unrecognized college domain, creates a pending College doc, blocks the TPO-only gate", async () => {
    const user = await seedStudent();
    const req = { userDoc: user, log: mockLog(), body: { collegeName: "Unrecognized College" } };
    const res = mockRes();

    await registerHandler(req, res);

    expect(res._json.success).toBe(true);
    expect(res._json.status).toBe("pending");

    const reloaded = await User.findById(user._id);
    expect(reloaded.role).toBe("tpo");
    expect(reloaded.tpoProfile.verified).toBe(false);
    expect(reloaded.tpoProfile.collegeDomain).toBe("unrecognized-college.ac.in");

    const college = await College.findByDomain("unrecognized-college.ac.in");
    expect(college).toBeTruthy();
    expect(college.status).toBe("pending");

    const gateOutcome = await runTpoOnlyGate({ userDoc: reloaded });
    expect(gateOutcome).toBe("verification");
  });

  it("a plain student is denied the TPO-only gate", async () => {
    const student = await seedStudent({ email: "juststudent2@test.com" });
    const outcome = await runTpoOnlyGate({ userDoc: student });
    expect(outcome).toBe("role");
  });

  it("a recruiter (wrong role) is denied the TPO-only gate even when verified for their own role", async () => {
    const recruiter = await seedStudent({
      email: "recruiter6@company.com",
      role: "recruiter",
      recruiterProfile: { companyName: "Co", designation: "R", companyDomain: "company.com", verified: true, verifiedAt: new Date() },
    });
    const outcome = await runTpoOnlyGate({ userDoc: recruiter });
    expect(outcome).toBe("role");
  });

  it("admin approval of a pending TPO's college verifies BOTH the College doc and the submitting user's tpoProfile", async () => {
    const user = await seedStudent({ email: "tposignup2@unrecognized-college.ac.in" });
    await registerHandler(
      { userDoc: user, log: mockLog(), body: { collegeName: "Unrecognized College 2" } },
      mockRes()
    );

    const admin = await User.create({ firebaseUid: "fb-admin-3", email: "admin3@codeclub.test", role: "admin" });
    const college = await College.findByDomain("unrecognized-college.ac.in");

    await approveTpo({ params: { collegeId: college._id.toString() }, userDoc: admin, log: mockLog() }, mockRes());

    const reloadedCollege = await College.findById(college._id);
    expect(reloadedCollege.status).toBe("verified");

    const reloadedUser = await User.findById(user._id);
    expect(reloadedUser.tpoProfile.verified).toBe(true);

    const gateOutcome = await runTpoOnlyGate({ userDoc: reloadedUser });
    expect(gateOutcome).toBe("allowed");
  });

  it("admin rejection of a pending TPO's college deletes the College doc and leaves the user's tpoProfile unverified", async () => {
    // CONTRACT NOTE (test defect, not a production bug — confirmed via
    // both adminController.js's own comment on rejectTpo and the existing
    // mocked unit test controllers/adminController.test.js, whose own
    // title is "deletes the college..."): unlike rejectStudentCollege,
    // which keeps the College doc around with status "rejected" (that
    // record has other purposes — it's linked from student `education`
    // records), a rejected TPO signup's College doc is deleted outright.
    // This test originally asserted the doc persisted with status
    // "rejected" — that's simply the wrong contract for this endpoint;
    // fixed to assert the documented, intended, already-covered behavior.
    const user = await seedStudent({ email: "tposignup3@unrecognized-college.ac.in" });
    await registerHandler(
      { userDoc: user, log: mockLog(), body: { collegeName: "Unrecognized College 3" } },
      mockRes()
    );

    const admin = await User.create({ firebaseUid: "fb-admin-4", email: "admin4@codeclub.test", role: "admin" });
    const college = await College.findByDomain("unrecognized-college.ac.in");

    await rejectTpo({ params: { collegeId: college._id.toString() }, userDoc: admin, log: mockLog() }, mockRes());

    const reloadedCollege = await College.findById(college._id);
    expect(reloadedCollege).toBeNull();

    const reloadedUser = await User.findById(user._id);
    // rejectTpo also demotes the requester back to a plain student (see
    // adminController.js) — so the gate is now denied at the ROLE check,
    // not the verification check. My first pass at this fix got this
    // wrong too (asserted "verification"); caught by re-reading
    // rejectTpo's actual behavior rather than assuming.
    expect(reloadedUser.role).toBe("student");
    expect(reloadedUser.tpoProfile.verified).toBe(false);
    expect(reloadedUser.tpoProfile.collegeDomain).toBeNull();

    const gateOutcome = await runTpoOnlyGate({ userDoc: reloadedUser });
    expect(gateOutcome).toBe("role");
  });

  it("admin behavior: an admin account itself always passes any role gate, TPO included", async () => {
    const admin = await User.create({ firebaseUid: "fb-admin-5", email: "admin5@codeclub.test", role: "admin" });
    const outcome = await runTpoOnlyGate({ userDoc: admin });
    expect(outcome).toBe("allowed");
  });

  it("a second TPO registering for an already-verified college is auto-verified immediately, no queue", async () => {
    const firstUser = await seedStudent({ email: "tpofirst@already-verified.ac.in" });
    await registerHandler(
      { userDoc: firstUser, log: mockLog(), body: { collegeName: "Already Verified College" } },
      mockRes()
    );
    const admin = await User.create({ firebaseUid: "fb-admin-6", email: "admin6@codeclub.test", role: "admin" });
    const college = await College.findByDomain("already-verified.ac.in");
    await approveTpo({ params: { collegeId: college._id.toString() }, userDoc: admin, log: mockLog() }, mockRes());

    const secondUser = await seedStudent({ email: "tposecond@already-verified.ac.in" });
    const res2 = mockRes();
    await registerHandler(
      { userDoc: secondUser, log: mockLog(), body: { collegeName: "Already Verified College" } },
      res2
    );

    expect(res2._json.status).toBe("verified");
    const reloadedSecond = await User.findById(secondUser._id);
    expect(reloadedSecond.tpoProfile.verified).toBe(true);
  });
});