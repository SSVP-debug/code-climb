import { describe, expect, it, vi, beforeEach } from "vitest";
import { requireRole, requireAdmin } from "./roleGuard.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("requireRole", () => {
  let res;
  let next;

  beforeEach(() => {
    res = mockRes();
    next = vi.fn();
  });

  it("calls next() when the user has one of the required roles", () => {
    const req = { userDoc: { role: "recruiter" } };
    requireRole("recruiter", "admin")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects with 403 when the user's role isn't in the allowed list", () => {
    const req = { userDoc: { role: "student" } };
    requireRole("recruiter", "admin")(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ yourRole: "student" })
    );
  });

  it("defaults to 'student' when req.userDoc is missing entirely", () => {
    const req = {};
    requireRole("admin")(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ yourRole: "student" })
    );
  });

  it("defaults to 'student' when req.userDoc.role is missing", () => {
    const req = { userDoc: {} };
    requireRole("student")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});

describe("requireAdmin", () => {
  let res;
  let next;

  beforeEach(() => {
    res = mockRes();
    next = vi.fn();
  });

  it("allows a plain admin through", () => {
    const req = { userDoc: { role: "admin" } };
    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("rejects a non-admin", () => {
    const req = { userDoc: { role: "recruiter" } };
    requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it(
    "prefers req.actingAdminDoc over req.userDoc while impersonating — " +
      "an admin impersonating a student must still pass requireAdmin",
    () => {
      const req = {
        userDoc: { role: "student" }, // the impersonation target
        actingAdminDoc: { role: "admin" }, // the real logged-in admin
      };
      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    }
  );

  it("cannot be spoofed by a student setting their own role to admin without actingAdminDoc", () => {
    // req.actingAdminDoc is only ever set by requireAuth during a real
    // impersonation session — a plain req.userDoc.role of "admin" with no
    // actingAdminDoc is the normal (non-impersonating) admin case, which
    // SHOULD pass. This test documents that requireAdmin has no other way
    // to become true: with neither field set to "admin", it must reject.
    const req = { userDoc: { role: "student" } };
    requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ yourRole: "student" })
    );
  });

  it("defaults to 'student' when both userDoc and actingAdminDoc are missing", () => {
    const req = {};
    requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ yourRole: "student" })
    );
  });
});
