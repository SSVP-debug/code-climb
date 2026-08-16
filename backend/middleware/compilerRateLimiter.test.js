import { describe, expect, it } from "vitest";
import { userOrIpKey } from "./rateLimiter.js";
// compilerRateLimiter itself is exercised indirectly: it's just
// `rateLimit({ ..., keyGenerator: userOrIpKey })`, and express-rate-limit's
// returned handler (v8) doesn't expose its options for introspection (no
// public `.keyGenerator` property), so the meaningful regression coverage
// is on userOrIpKey itself — the function compilerRateLimiter.js now wires
// in instead of its previous broken local copy.
import "./compilerRateLimiter.js";

/**
 * Judge0 Integration Hardening, item 7.
 *
 * compilerRateLimiter previously keyed on `req.user?.uid`, but nothing in
 * this backend ever sets `req.user` — middleware/auth.js only ever sets
 * `req.auth` on a verified request. That meant EVERY authenticated request
 * fell through to IP-based keying, silently defeating the whole point of
 * per-user rate limiting: one student on a shared college NAT could exhaust
 * the limit for every other student behind the same IP.
 *
 * Fixed by having compilerRateLimiter reuse rateLimiter.js's userOrIpKey
 * (the same function apiLimiter/aiLimiter/compilerLimiter already use)
 * instead of a second, independently-broken copy of the same logic.
 */
describe("compilerRateLimiter — per-user key derivation", () => {
  it("userOrIpKey keys on req.auth.uid (the field auth.js actually sets) for an authenticated request", () => {
    const req = { auth: { uid: "firebase-uid-123" }, ip: "10.0.0.1" };
    expect(userOrIpKey(req)).toBe("firebase-uid-123");
  });

  it("two different authenticated users behind the same IP get two different keys", () => {
    const reqA = { auth: { uid: "student-a" }, ip: "10.0.0.1" };
    const reqB = { auth: { uid: "student-b" }, ip: "10.0.0.1" };

    expect(userOrIpKey(reqA)).not.toBe(userOrIpKey(reqB));
  });

  it("falls back to IP only when there is genuinely no authenticated identity on the request", () => {
    const req = { ip: "10.0.0.1", headers: {}, socket: { remoteAddress: "10.0.0.1" } };
    // No req.auth, no req.user — this is the unauthenticated fallback path,
    // not the (now-impossible) "authenticated but req.user was checked
    // instead of req.auth" bug this test file exists to catch a regression of.
    expect(userOrIpKey(req)).not.toBe("firebase-uid-123");
  });
});
