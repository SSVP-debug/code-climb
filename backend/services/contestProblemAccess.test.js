import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../models/Contest.js", () => ({
  default: { find: vi.fn() },
}));

import Contest from "../models/Contest.js";
import { canAccessContestProblem } from "./contestProblemAccess.js";

function mockContestQuery(contests) {
  Contest.find.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue(contests),
  });
}

function makeContest(overrides = {}) {
  const now = Date.now();
  return {
    startsAt: new Date(now - 60_000),
    endsAt: new Date(now + 60_000),
    createdBy: { toString: () => "organizer1" },
    participants: [{ userId: { toString: () => "participant1" } }],
    ...overrides,
  };
}

describe("canAccessContestProblem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fails closed for a slug with no contest referencing it at all (orphaned/misconfigured)", async () => {
    mockContestQuery([]);

    const allowed = await canAccessContestProblem("secret-slug", { _id: { toString: () => "anyone" } });

    expect(allowed).toBe(false);
  });

  it("denies an anonymous (no userDoc) caller for an active contest", async () => {
    mockContestQuery([makeContest()]);

    const allowed = await canAccessContestProblem("secret-slug", null);

    expect(allowed).toBe(false);
  });

  it("denies an authenticated non-participant, non-organizer during an active contest", async () => {
    mockContestQuery([makeContest()]);

    const allowed = await canAccessContestProblem("secret-slug", { _id: { toString: () => "random-user" } });

    expect(allowed).toBe(false);
  });

  it("allows a joined participant once the contest is active", async () => {
    mockContestQuery([makeContest()]);

    const allowed = await canAccessContestProblem("secret-slug", { _id: { toString: () => "participant1" } });

    expect(allowed).toBe(true);
  });

  it("denies a joined participant while the contest is still upcoming (has not started)", async () => {
    const now = Date.now();
    mockContestQuery([
      makeContest({ startsAt: new Date(now + 60_000), endsAt: new Date(now + 120_000) }),
    ]);

    const allowed = await canAccessContestProblem("secret-slug", { _id: { toString: () => "participant1" } });

    expect(allowed).toBe(false);
  });

  it("allows the organizer at any time, including before the contest has started", async () => {
    const now = Date.now();
    mockContestQuery([
      makeContest({ startsAt: new Date(now + 60_000), endsAt: new Date(now + 120_000) }),
    ]);

    const allowed = await canAccessContestProblem("secret-slug", { _id: { toString: () => "organizer1" } });

    expect(allowed).toBe(true);
  });

  it("opens the problem up to EVERYONE once the contest has ended, per the documented post-contest policy", async () => {
    const now = Date.now();
    mockContestQuery([
      makeContest({ startsAt: new Date(now - 120_000), endsAt: new Date(now - 60_000) }),
    ]);

    const randomUser = await canAccessContestProblem("secret-slug", { _id: { toString: () => "random-user" } });
    const anonymous = await canAccessContestProblem("secret-slug", null);

    expect(randomUser).toBe(true);
    expect(anonymous).toBe(true);
  });

  it("grants access if ANY contest referencing the slug currently justifies it, even if another doesn't", async () => {
    const now = Date.now();
    mockContestQuery([
      // Contest A: still upcoming — wouldn't grant access on its own.
      makeContest({ startsAt: new Date(now + 60_000), endsAt: new Date(now + 120_000), createdBy: { toString: () => "other-organizer" } }),
      // Contest B: active, and this caller is a participant in it.
      makeContest(),
    ]);

    const allowed = await canAccessContestProblem("secret-slug", { _id: { toString: () => "participant1" } });

    expect(allowed).toBe(true);
  });
});
