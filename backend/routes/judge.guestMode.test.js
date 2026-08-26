import { describe, expect, it } from "vitest";
import judgeRouter from "./judge.js";
import compilerRouter from "./compiler.js";

/**
 * Guest Mode, Phase 1 — route-wiring regression tests.
 *
 * Structural tests on the Express router itself (router.stack), same
 * pattern as routes/recruiter.test.js's "requireAuth wiring" describe
 * block: the thing that actually matters here is which auth middleware is
 * REGISTERED on each route, not just what the handler does in isolation —
 * a handler-only test can't tell you whether optionalAuth/requireAuth ran
 * before it at all.
 *
 * Covers the core Guest Mode backend change: POST /api/judge/run and
 * POST /api/compiler/run must be guest-reachable (optionalAuth), while
 * POST /api/judge/submit must remain account-only (requireAuth) — see
 * server.js's own comment on why requireAuth moved off the router-level
 * mount and onto these individual routes instead.
 */
describe("judge router — auth wiring (Guest Mode)", () => {
  function middlewareNamesFor(path) {
    const layer = judgeRouter.stack.find(
      (l) => l.route && l.route.path === path
    );
    if (!layer) throw new Error(`No route registered for ${path}`);
    return layer.route.stack.map((s) => s.name);
  }

  it("POST /run uses optionalAuth, NOT requireAuth — guests may Run", () => {
    const names = middlewareNamesFor("/run");
    expect(names).toContain("optionalAuth");
    expect(names).not.toContain("requireAuth");
  });

  it("POST /submit uses requireAuth — an account is required to persist a Submission", () => {
    expect(middlewareNamesFor("/submit")).toContain("requireAuth");
  });

  it("POST /submit does NOT use optionalAuth — Submit is never guest-reachable", () => {
    expect(middlewareNamesFor("/submit")).not.toContain("optionalAuth");
  });

  // optionalAuth must resolve req.userDoc BEFORE judgeRunLimiter runs, so
  // the guest-vs-authenticated rate limit split (rateLimiter.js's
  // judgeRunLimiter) sees the right value — see that file's comment.
  // judgeRunLimiter itself is anonymous in the middleware chain (it's the
  // function express-rate-limit's rateLimit() returns), so this checks
  // position rather than name: optionalAuth must be the very first
  // middleware on this route, before anything else runs.
  it("POST /run runs optionalAuth first, before rate limiting/validation", () => {
    const names = middlewareNamesFor("/run");
    expect(names[0]).toBe("optionalAuth");
  });
});

describe("compiler router — auth wiring (Guest Mode)", () => {
  function middlewareNamesFor(path) {
    const layer = compilerRouter.stack.find(
      (l) => l.route && l.route.path === path
    );
    if (!layer) throw new Error(`No route registered for ${path}`);
    return layer.route.stack.map((s) => s.name);
  }

  it("POST /run uses optionalAuth, NOT requireAuth — guests may Run", () => {
    const names = middlewareNamesFor("/run");
    expect(names).toContain("optionalAuth");
    expect(names).not.toContain("requireAuth");
  });
});
