import { describe, expect, it, vi, beforeEach } from "vitest";
import { switchActiveRole } from "./userController.js";

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function makeUserDoc(overrides = {}) {
  return {
    role: "student",
    roles: ["student"],
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("switchActiveRole — POST /api/users/me/switch-role", () => {
  let res;

  beforeEach(() => {
    res = mockRes();
  });

  it("503s when the database is unavailable", async () => {
    const req = { userDoc: null, body: { role: "tpo" } };
    await switchActiveRole(req, res);
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it("400s for a role outside the switchable set", async () => {
    const req = { userDoc: makeUserDoc(), body: { role: "admin" } };
    await switchActiveRole(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("400s for a nonsense/missing role", async () => {
    const req = { userDoc: makeUserDoc(), body: {} };
    await switchActiveRole(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it(
    "REGRESSION: rejects switching to a role the account never registered for — " +
      "a plain Student can't self-grant tpo/recruiter via this endpoint",
    async () => {
      const userDoc = makeUserDoc({ role: "student", roles: ["student"] });
      const req = { userDoc, body: { role: "tpo" } };

      await switchActiveRole(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(userDoc.role).toBe("student"); // unchanged
      expect(userDoc.save).not.toHaveBeenCalled();
    }
  );

  it("switches the active role when the target role IS authorized", async () => {
    const userDoc = makeUserDoc({ role: "tpo", roles: ["student", "tpo"] });
    const req = { userDoc, body: { role: "student" } };

    await switchActiveRole(req, res);

    expect(userDoc.role).toBe("student");
    expect(userDoc.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      role: "student",
      roles: ["student", "tpo"],
    });
  });

  it("a Student+TPO account can switch back and forth without re-registering", async () => {
    const userDoc = makeUserDoc({ role: "student", roles: ["student", "tpo"] });

    await switchActiveRole({ userDoc, body: { role: "tpo" } }, mockRes());
    expect(userDoc.role).toBe("tpo");

    await switchActiveRole({ userDoc, body: { role: "student" } }, mockRes());
    expect(userDoc.role).toBe("student");
  });

  it("falls back to authorizedRoles: [\"student\"] when roles is unset (pre-migration document)", async () => {
    const userDoc = makeUserDoc({ role: "student", roles: undefined });
    const req = { userDoc, body: { role: "tpo" } };

    await switchActiveRole(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ authorizedRoles: ["student"] })
    );
  });
});
