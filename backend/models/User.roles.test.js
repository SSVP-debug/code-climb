import { describe, expect, it } from "vitest";
import User from "./User.js";

// No DB connection needed here — grantRole/revokeRole are plain instance
// methods that only mutate `this.roles`, and `new User(...)` (without
// .save()) is enough to get schema defaults applied. See
// models/User.js's role/roles comment for the architecture this is
// covering.

function makeUser(overrides = {}) {
  return new User({
    firebaseUid: `fb-${Math.random().toString(36).slice(2)}`,
    email: "person@example.com",
    ...overrides,
  });
}

describe("User.roles / grantRole / revokeRole (role/profile isolation fix)", () => {
  it("defaults roles to [\"student\"] for a brand-new account", () => {
    const user = makeUser();
    expect(user.roles).toEqual(["student"]);
    expect(user.role).toBe("student");
  });

  it("grantRole adds a new authorized role without dropping existing ones", () => {
    const user = makeUser();
    user.grantRole("tpo");
    expect(user.roles).toEqual(["student", "tpo"]);
  });

  it("grantRole is idempotent — granting an already-authorized role doesn't duplicate it", () => {
    const user = makeUser();
    user.grantRole("tpo");
    user.grantRole("tpo");
    expect(user.roles).toEqual(["student", "tpo"]);
  });

  it("grantRole does not touch the active `role` field — callers set that separately", () => {
    const user = makeUser();
    user.grantRole("tpo");
    expect(user.role).toBe("student");
  });

  it("supports an identity holding student + tpo + recruiter simultaneously", () => {
    const user = makeUser();
    user.grantRole("tpo");
    user.grantRole("recruiter");
    expect(user.roles).toEqual(["student", "tpo", "recruiter"]);
  });

  it("revokeRole removes a role that's no longer authorized", () => {
    const user = makeUser();
    user.grantRole("tpo");
    user.revokeRole("tpo");
    expect(user.roles).toEqual(["student"]);
  });

  it("revokeRole never removes \"student\" — every account keeps that baseline", () => {
    const user = makeUser();
    user.revokeRole("student");
    expect(user.roles).toEqual(["student"]);
  });

  it("revokeRole falls back to [\"student\"] if the last non-student role is removed", () => {
    const user = makeUser({ role: "tpo", roles: ["tpo"] });
    user.revokeRole("tpo");
    expect(user.roles).toEqual(["student"]);
  });

  it("grantRole self-heals a missing/empty roles array (pre-migration documents)", () => {
    const user = makeUser({ role: "tpo" });
    user.roles = [];
    user.grantRole("recruiter");
    expect(user.roles).toEqual(["student", "recruiter"]);
  });
});
