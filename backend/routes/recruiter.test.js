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
vi.mock("../services/settingsService.js", () => ({
  getSettings: vi.fn(),
}));
vi.mock("../models/VerifiedDomain.js", () => ({
  default: { findOne: vi.fn() },
}));

import User from "../models/User.js";
import RecruiterInterest from "../models/RecruiterInterest.js";
import { createNotification } from "../services/notificationService.js";
import { getSettings } from "../services/settingsService.js";
import VerifiedDomain from "../models/VerifiedDomain.js";
import {
  handleCreateInterest,
  recruiterRegistrationGate,
  handleRegister,
  default as recruiterRouter,
} from "./recruiter.js";

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

// Plan 009: registration-toggle enforcement (test plan's explicit
// requirement — "disabling recruiterRegistrationEnabled rejects new
// recruiter signups but does not affect an existing recruiter's ability
// to log in/use the app").
describe("recruiterRegistrationGate", () => {
  let res;

  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
  });

  it("blocks a new registration with 403 when recruiterRegistrationEnabled is false", async () => {
    getSettings.mockResolvedValueOnce({ recruiterRegistrationEnabled: false });

    const blocked = await recruiterRegistrationGate({}, res);

    expect(blocked).toBe(true);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("allows registration through when recruiterRegistrationEnabled is true (the default)", async () => {
    getSettings.mockResolvedValueOnce({ recruiterRegistrationEnabled: true });

    const blocked = await recruiterRegistrationGate({}, res);

    expect(blocked).toBe(false);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("takes no dependency on req.userDoc — an existing recruiter's other routes never call this gate", async () => {
    getSettings.mockResolvedValueOnce({ recruiterRegistrationEnabled: false });
    await expect(recruiterRegistrationGate({}, res)).resolves.toBe(true);
  });
});

// Backend hardening pass 1 — regression tests for the /register auth bug.
// Previously: /api/recruiter was mounted without requireAuth, so an
// unauthenticated POST /register reached `req.userDoc.role = "recruiter"`
// with req.userDoc undefined and crashed with an uncaught TypeError (opaque
// 500 instead of 401). Fixed by (a) adding requireAuth on the route in
// server.js-adjacent recruiter.js, and (b) a defensive `if (!req.userDoc)`
// guard inside the handler itself as defense in depth.
describe("handleRegister", () => {
  let res;

  beforeEach(() => {
    vi.clearAllMocks();
    res = mockRes();
    getSettings.mockResolvedValue({ recruiterRegistrationEnabled: true });
  });

  it("returns 401 (not a crash) when req.userDoc is missing — the exact bug this fixes", async () => {
    const req = { body: { companyName: "Acme", designation: "Eng Manager" }, userDoc: undefined };

    await expect(handleRegister(req, res)).resolves.not.toThrow();

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

  it("registers an authenticated user as a pending recruiter when the domain isn't pre-verified", async () => {
    VerifiedDomain.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
    const save = vi.fn().mockResolvedValue(true);
    const req = {
      body: { companyName: "Acme Corp", designation: "Engineering Manager" },
      userDoc: { email: "recruiter@acme.com", role: "student", save },
    };

    await handleRegister(req, res);

    expect(req.userDoc.role).toBe("recruiter");
    expect(req.userDoc.recruiterProfile.verified).toBe(false);
    expect(save).toHaveBeenCalledOnce();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, role: "recruiter", status: "pending" })
    );
  });

  it("auto-verifies when the company domain is on the VerifiedDomain allowlist", async () => {
    VerifiedDomain.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue({ domain: "acme.com" }) });
    const save = vi.fn().mockResolvedValue(true);
    const req = {
      body: { companyName: "Acme Corp", designation: "Engineering Manager" },
      userDoc: { email: "recruiter@acme.com", role: "student", save },
    };

    await handleRegister(req, res);

    expect(req.userDoc.recruiterProfile.verified).toBe(true);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "verified" }));
  });

  it("respects recruiterRegistrationGate even for an authenticated user (registration disabled)", async () => {
    getSettings.mockResolvedValueOnce({ recruiterRegistrationEnabled: false });
    const save = vi.fn();
    const req = {
      body: { companyName: "Acme Corp", designation: "Engineering Manager" },
      userDoc: { email: "recruiter@acme.com", role: "student", save },
    };

    await handleRegister(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(save).not.toHaveBeenCalled();
  });
});

// Route-wiring regression tests — assert requireAuth is actually present in
// the middleware chain for every protected route, and deliberately absent
// from the one intentionally-public route (/verify/:username). This is a
// structural test on the Express router itself (router.stack), not just the
// handler in isolation, because the bug this fixes was a *wiring* bug: the
// handler code alone couldn't tell you whether requireAuth ran before it.
describe("recruiter router — requireAuth wiring", () => {
  function middlewareNamesFor(path) {
    const layer = recruiterRouter.stack.find(
      (l) => l.route && l.route.path === path
    );
    if (!layer) throw new Error(`No route registered for ${path}`);
    return layer.route.stack.map((s) => s.name);
  }

  it("requires auth on POST /register", () => {
    expect(middlewareNamesFor("/register")).toContain("requireAuth");
  });

  it("requires auth on GET /candidates", () => {
    expect(middlewareNamesFor("/candidates")).toContain("requireAuth");
  });

  it("requires auth on POST /skills-test", () => {
    expect(middlewareNamesFor("/skills-test")).toContain("requireAuth");
  });

  it("requires auth on POST /interest", () => {
    expect(middlewareNamesFor("/interest")).toContain("requireAuth");
  });

  it("requires auth on GET /interests", () => {
    expect(middlewareNamesFor("/interests")).toContain("requireAuth");
  });

  it("requires auth on GET /skills-tests", () => {
    expect(middlewareNamesFor("/skills-tests")).toContain("requireAuth");
  });

  it("requires auth on GET /skills-test/:id", () => {
    expect(middlewareNamesFor("/skills-test/:id")).toContain("requireAuth");
  });

  it("does NOT require auth on GET /verify/:username — deliberately public", () => {
    expect(middlewareNamesFor("/verify/:username")).not.toContain("requireAuth");
  });
});