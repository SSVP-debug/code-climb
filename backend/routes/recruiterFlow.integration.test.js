import { describe, expect, it, vi, beforeAll, afterEach, afterAll } from "vitest";
import { startTestMongo, clearTestMongo, stopTestMongo } from "../test/mongoMemoryServer.js";
import User from "../models/User.js";
import { handleRegister } from "./recruiter.js";
import { requireRole } from "../middleware/roleGuard.js";
import { requireVerified } from "../middleware/requireVerified.js";
import { approveRecruiter, rejectRecruiter } from "../controllers/adminController.js";

// ── P0 workflow: Recruiter registration → pending → verification → ────────
// ── recruiter-only endpoint ────────────────────────────────────────────
//
// Real Mongo User documents throughout; no external boundary to mock here
// (recruiterRegistrationGate reads Settings via the cached settingsService,
// itself backed by real Mongo — no Redis/Firebase involved in this path).

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
    email: "recruiter1@unrecognized-corp.com",
    ...overrides,
  });
}

// A representative recruiter-only endpoint's authorization chain —
// requireRole("recruiter","admin") then requireVerified — run for real,
// in sequence, the way server.js actually wires GET /api/recruiter/candidates.
async function runRecruiterOnlyGate(req, res) {
  let blocked = false;
  const next = () => {};
  const guardedRes = new Proxy(res, {
    get(t, p) {
      if (p === "status") blocked = true;
      return t[p];
    },
  });
  await requireRole("recruiter", "admin")(req, guardedRes, next);
  if (blocked) return "role";
  blocked = false;
  await requireVerified(req, guardedRes, next);
  if (blocked) return "verification";
  return "allowed";
}

describe("Recruiter registration → pending → verification → recruiter-only endpoint (real Mongo)", () => {
  beforeAll(async () => {
    await startTestMongo();
  }, 60_000);

  afterEach(async () => {
    await clearTestMongo();
  });

  afterAll(async () => {
    await stopTestMongo();
  });

  it("registers a real recruiter as pending (unrecognized company domain) and blocks the recruiter-only gate", async () => {
    const user = await seedStudent();
    const req = { userDoc: user, log: mockLog(), body: { companyName: "Unrecognized Corp", designation: "SWE Recruiter" } };
    const res = mockRes();

    await handleRegister(req, res);

    expect(res._json.success).toBe(true);
    expect(res._json.status).toBe("pending");

    const reloaded = await User.findById(user._id);
    expect(reloaded.role).toBe("recruiter");
    expect(reloaded.recruiterProfile.verified).toBe(false);

    const gateOutcome = await runRecruiterOnlyGate({ userDoc: reloaded }, mockRes());
    expect(gateOutcome).toBe("verification");
  });

  it("a plain student is denied by the role gate before ever registering as a recruiter", async () => {
    const student = await seedStudent({ email: "juststudent@test.com" });

    const outcome = await runRecruiterOnlyGate({ userDoc: student }, mockRes());
    expect(outcome).toBe("role");
  });

  it("admin approval of a pending recruiter flips real verified state, unblocking the recruiter-only gate", async () => {
    const user = await seedStudent({ email: "recruiter2@unrecognized-corp.com" });
    await handleRegister(
      { userDoc: user, log: mockLog(), body: { companyName: "Unrecognized Corp", designation: "Recruiter" } },
      mockRes()
    );

    const admin = await User.create({ firebaseUid: "fb-admin-1", email: "admin1@codeclub.test", role: "admin" });
    const pending = await User.findById(user._id);

    await approveRecruiter({ params: { id: pending._id.toString() }, userDoc: admin, log: mockLog() }, mockRes());

    const reloaded = await User.findById(user._id);
    expect(reloaded.recruiterProfile.verified).toBe(true);
    expect(reloaded.recruiterProfile.verifiedAt).toBeTruthy();

    const gateOutcome = await runRecruiterOnlyGate({ userDoc: reloaded }, mockRes());
    expect(gateOutcome).toBe("allowed");
  });

  it("admin rejection of a pending recruiter demotes the account back to student", async () => {
    const user = await seedStudent({ email: "recruiter3@unrecognized-corp.com" });
    await handleRegister(
      { userDoc: user, log: mockLog(), body: { companyName: "Unrecognized Corp", designation: "Recruiter" } },
      mockRes()
    );

    const admin = await User.create({ firebaseUid: "fb-admin-2", email: "admin2@codeclub.test", role: "admin" });
    const pending = await User.findById(user._id);

    await rejectRecruiter({ params: { id: pending._id.toString() }, userDoc: admin, log: mockLog() }, mockRes());

    const reloaded = await User.findById(user._id);
    expect(reloaded.role).toBe("student");
    expect(reloaded.recruiterProfile.verified).toBe(false);
  });

  it("an already-verified recruiter (auto-verified domain) passes the recruiter-only gate immediately", async () => {
    const user = await seedStudent({
      email: "recruiter4@google.com",
      role: "recruiter",
      recruiterProfile: { companyName: "Google", designation: "SWE", companyDomain: "google.com", verified: true, verifiedAt: new Date() },
    });

    const outcome = await runRecruiterOnlyGate({ userDoc: user }, mockRes());
    expect(outcome).toBe("allowed");
  });

  it("a TPO account (wrong role) is denied the recruiter-only gate even when verified for their own role", async () => {
    const tpo = await seedStudent({
      email: "tpo1@college.ac.in",
      role: "tpo",
      tpoProfile: { collegeDomain: "college.ac.in", collegeName: "Test College", verified: true, verifiedAt: new Date() },
    });

    const outcome = await runRecruiterOnlyGate({ userDoc: tpo }, mockRes());
    expect(outcome).toBe("role");
  });

  it("re-registering (already a pending recruiter) overwrites the profile rather than crashing — documents actual behavior, not a security gap", async () => {
    const user = await seedStudent({ email: "recruiter5@unrecognized-corp.com" });
    await handleRegister(
      { userDoc: user, log: mockLog(), body: { companyName: "First Co", designation: "Recruiter" } },
      mockRes()
    );

    const afterFirst = await User.findById(user._id);
    const res2 = mockRes();
    await handleRegister(
      { userDoc: afterFirst, log: mockLog(), body: { companyName: "Second Co", designation: "Senior Recruiter" } },
      res2
    );

    const reloaded = await User.findById(user._id);
    expect(reloaded.recruiterProfile.companyName).toBe("Second Co");
    // Re-registration does not silently grant verification — still
    // subject to the same domain check as any first-time registration.
    expect(reloaded.recruiterProfile.verified).toBe(false);
  });
});