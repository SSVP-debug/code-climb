import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { GUEST_RUN_LIMIT_PER_MINUTE } from "../config/guestLimits.js";


/**
 * Key generator: prefer authenticated user UID so rate limits are per-user,
 * not per-IP. This prevents one user from blocking an entire college network
 * that shares a single NAT IP (very common in Indian engineering colleges).
 *
 * Falls back to req.ip for unauthenticated routes.
 */
// Exported so other rate limiters (e.g. middleware/compilerRateLimiter.js)
// can share the exact same key-derivation logic instead of redeclaring a
// slightly different version that can drift out of sync — see Judge0
// Integration Hardening item 7, which found compilerRateLimiter.js checking
// only `req.user?.uid` (never set anywhere in this backend — only
// `req.auth.uid` is), so it silently fell back to IP-keying for every
// authenticated request instead of per-user keying.
export function userOrIpKey(req) {
  return (
    req.auth?.uid ||
    req.user?.uid ||
    ipKeyGenerator(req)
  );
}

/**
 * Code execution limiter — applied to /compiler and /judge routes.
 * 10 runs per minute per user. Generous for real use; blocks hammering.
 */
export const compilerLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 10,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: {
    error: "Too many code submissions. Please wait a moment before trying again.",
  },
});

/**
 * General API limiter — applied to progress, submissions, user routes.
 * 200 requests per 15 minutes per user.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please slow down.",
  },
});

/**
 * AI Insights limiter — each call costs Anthropic API tokens.
 * 5 requests per 10 minutes per user. Prevents runaway costs.
 */
export const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: {
    error: "You've requested insights too many times. Wait a few minutes before refreshing.",
  },
});

/**
 * Judge "Run" limiter — applied only to POST /api/judge/run.
 *
 * Fest Readiness Audit, P1-2: Run and Submit used to share both the same
 * rate limiter (apiLimiter, 200/15min — generic, shared with all other
 * /api/judge traffic) and the same global Judge0 concurrency pool (see
 * services/executionQueue.js), with nothing to stop one participant
 * repeatedly mashing Run from degrading Submit availability for everyone
 * else during a live contest. This mirrors compilerLimiter's existing
 * 10/min figure (already used for custom-stdin runs via /api/compiler) —
 * generous enough for real iteration, tight enough that Run-spam from a
 * few users can't dominate the shared execution capacity a contest's
 * Submits need. Submit deliberately keeps the more permissive apiLimiter
 * (see routes/judge.js) — a participant should never feel throttled on
 * the action that actually scores.
 *
 * Guest Mode (Phase 1): `/run` is reachable by guests too (optionalAuth,
 * not requireAuth — see routes/judge.js), so `max` is a function rather
 * than a fixed number: an authenticated caller (req.userDoc set by
 * optionalAuth, which runs BEFORE this middleware on the route — see
 * routes/judge.js's ordering) keeps the existing 10/min; a guest
 * (req.userDoc absent) gets the stricter, separately-configurable
 * GUEST_RUN_LIMIT_PER_MINUTE (config/guestLimits.js) instead. Authenticated
 * behavior is unchanged — this only ever narrows the limit for the guest
 * branch, never widens it for anyone.
 */
// Extracted as its own named export (rather than an inline arrow in the
// rateLimit() config below) purely so it's directly unit-testable without
// having to drive the whole express-rate-limit middleware — see
// rateLimiter.guestMode.test.js.
export function judgeRunMax(req) {
  return req.userDoc ? 10 : GUEST_RUN_LIMIT_PER_MINUTE;
}

export const judgeRunLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: judgeRunMax,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: {
    error: "Too many Run requests. Please wait a moment — if your code looks ready, try Submit.",
  },
});

/**
 * College verification resend limiter — applied to
 * POST /api/college-verification/resend. 3 resends per hour per user;
 * generous enough for a genuinely lost/expired email, tight enough to stop
 * someone hammering the mail provider.
 */
export const collegeVerificationResendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: {
    error: "Too many resend attempts. Please wait before requesting another verification email.",
  },
});