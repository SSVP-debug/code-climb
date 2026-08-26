import { describe, expect, it } from "vitest";
import { judgeRunMax } from "./rateLimiter.js";
import { GUEST_RUN_LIMIT_PER_MINUTE } from "../config/guestLimits.js";

/**
 * Guest Mode, Phase 1 — the Run rate-limit split.
 *
 * judgeRunLimiter (rateLimiter.js) uses judgeRunMax as its `max` so an
 * authenticated caller keeps the existing 10/min while a guest gets the
 * stricter, separately-configurable GUEST_RUN_LIMIT_PER_MINUTE instead —
 * see that file's own comment. Tested directly here (rather than driving
 * the whole express-rate-limit middleware) since judgeRunMax is a pure
 * function of req.userDoc.
 */
describe("judgeRunMax — Guest Mode Run rate limit", () => {
  it("returns the authenticated limit (10) when req.userDoc is set", () => {
    expect(judgeRunMax({ userDoc: { _id: "user1" } })).toBe(10);
  });

  it("returns GUEST_RUN_LIMIT_PER_MINUTE when req.userDoc is absent (guest)", () => {
    expect(judgeRunMax({ userDoc: undefined })).toBe(GUEST_RUN_LIMIT_PER_MINUTE);
  });

  it("returns GUEST_RUN_LIMIT_PER_MINUTE when req.userDoc is null", () => {
    expect(judgeRunMax({ userDoc: null })).toBe(GUEST_RUN_LIMIT_PER_MINUTE);
  });

  it("the guest limit is strictly lower than the authenticated limit", () => {
    // Guards against a future edit accidentally making guests MORE
    // permissive than real accounts, which would defeat the point of the
    // split entirely.
    expect(GUEST_RUN_LIMIT_PER_MINUTE).toBeLessThan(10);
  });
});
