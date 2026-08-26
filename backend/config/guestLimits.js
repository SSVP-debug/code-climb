// ── Guest Mode execution limits ─────────────────────────────────────────────
// Guest Mode architecture (Phase 1): guests (no Firebase session — see
// middleware/auth.js's optionalAuth) may use POST /api/judge/run, but at a
// stricter per-minute cap than authenticated users (middleware/
// rateLimiter.js's judgeRunLimiter, 10/min). Kept as its own tiny config
// module — not a literal inline in rateLimiter.js — specifically so this
// number can be tuned (or overridden per-environment via the env var) later
// without touching the rate-limiter/middleware wiring itself.
//
// Default (3/min) is deliberately conservative: a guest session has no
// account-level accountability (no suspension, no per-user history) the way
// an authenticated 10/min does, and shares Judge0/executionQueue capacity
// with every real user. Raise it only with a real signal (e.g. guest
// conversion data, Judge0 headroom) — see docs/judge0-setup.md.
export const GUEST_RUN_LIMIT_PER_MINUTE =
  Number(process.env.GUEST_RUN_LIMIT_PER_MINUTE) > 0
    ? Number(process.env.GUEST_RUN_LIMIT_PER_MINUTE)
    : 3;
