/**
 * Validates the Judge0 configuration at server startup and does a
 * non-blocking reachability check.
 *
 * Deliberately never throws or blocks `start()` in server.js — same
 * "never crash on an external dependency" pattern as config/db.js. A
 * misconfigured or unreachable Judge0 instance should produce a loud log
 * line, not a failed deploy; the judge/compiler routes will surface the
 * real error to the user on their next submission anyway.
 */
import { logger } from "./logger.js";

export function validateJudge0Config() {
  const rawUrl = process.env.JUDGE0_API_URL;

  if (!rawUrl) {
    logger.warn(
      "[Judge0] JUDGE0_API_URL not set — defaulting to the public " +
        "ce.judge0.com instance. That instance is rate-limited and shared " +
        "with everyone else using it; fine for local dev, not for " +
        "production. See docs/judge0-setup.md for self-hosted (Docker) " +
        "and RapidAPI setup."
    );
    return;
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    logger.error(
      `[Judge0] JUDGE0_API_URL is not a valid URL: "${rawUrl}". ` +
        "Judge/compiler routes will fail until this is fixed."
    );
    return;
  }

  if (
    process.env.NODE_ENV === "production" &&
    parsed.hostname === "ce.judge0.com"
  ) {
    logger.warn(
      "[Judge0] Running in production against the public ce.judge0.com " +
        "instance. This is the single biggest scale bottleneck in the " +
        "stack — it's rate-limited and shared. Migrate to a dedicated " +
        "instance before real traffic; see docs/judge0-setup.md."
    );
  }

  // Non-blocking reachability check — fire and forget, log only.
  checkReachability(parsed.origin);
}

async function checkReachability(origin) {
  try {
    const response = await fetch(origin, { signal: AbortSignal.timeout(5000) });
    // Judge0's root path commonly 404s even when the service is healthy —
    // any response at all (not a thrown network error) means the host is up.
    logger.info(`[Judge0] Reachability check: ${origin} responded (HTTP ${response.status}).`);
  } catch (err) {
    logger.warn(
      { err },
      `[Judge0] Reachability check failed for ${origin} — server is starting anyway, this only affects code execution.`
    );
  }
}