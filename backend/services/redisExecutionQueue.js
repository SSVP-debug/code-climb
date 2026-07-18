/**
 * Redis-backed distributed semaphore for Judge0 execution concurrency.
 *
 * directExecutionQueue.js's in-process semaphore only caps concurrency per
 * Node process. Railway can run N replicas of this backend, so the
 * *effective* global ceiling was "MAX_CONCURRENT × N" — not the number an
 * operator actually configured — flagged as a scalability finding in the
 * 2026-07 staff engineering review (§8), which also pointed out the Redis
 * client is already plumbed in for exactly this class of problem (see
 * utils/cache.js's near-identical multi-instance fix for caching).
 *
 * Implementation: a Redis sorted set (`judge0:semaphore`) where each held
 * slot is a random token scored by its lease-expiry timestamp (ms).
 * Acquiring a slot is a single Lua script, so "sweep expired holders,
 * count what's left, add mine if there's room" is one atomic round trip —
 * no instance can race another between the count-check and the write,
 * which a naive ZCARD-then-ZADD from application code would allow. Expired
 * leases (a slot whose holder crashed, or a Judge0 call that hung past its
 * own timeout) are swept on every acquire attempt, so a dead holder can't
 * wedge the semaphore forever — it just self-heals once the lease passes.
 */
import { logger } from "../config/logger.js";

export const MAX_CONCURRENT = parseInt(process.env.JUDGE0_MAX_CONCURRENCY || "8", 10);

// How long a held slot stays valid before Redis treats it as abandoned and
// lets someone else take it. Must comfortably exceed the slowest realistic
// Judge0 round trip — see wallTimeLimit in config/executionLimits.js and
// the retry loop in compilerController.js's fetchJudge0 — or a still-
// running job could have its slot reclaimed out from under it.
export const LEASE_MS = parseInt(process.env.JUDGE0_LEASE_MS || "30000", 10);

// How long a caller keeps retrying to acquire a slot before giving up. A
// burst of submissions should queue briefly, not pile up indefinitely and
// time out the HTTP request anyway with no useful error.
export const ACQUIRE_TIMEOUT_MS = parseInt(process.env.JUDGE0_ACQUIRE_TIMEOUT_MS || "20000", 10);

const POLL_INTERVAL_MS = 150;
const SEMAPHORE_KEY = "judge0:semaphore";

// KEYS[1] = semaphore key
// ARGV[1] = now (ms) — anything scored at or below this is an expired lease
// ARGV[2] = this attempt's lease expiry (ms), stored as the new entry's score
// ARGV[3] = max concurrent slots
// ARGV[4] = this attempt's token
// Returns 1 if the slot was acquired, 0 if the semaphore is full.
const ACQUIRE_SCRIPT = `
  redis.call("ZREMRANGEBYSCORE", KEYS[1], "-inf", ARGV[1])
  local count = redis.call("ZCARD", KEYS[1])
  if count < tonumber(ARGV[3]) then
    redis.call("ZADD", KEYS[1], ARGV[2], ARGV[4])
    return 1
  end
  return 0
`;

function makeToken() {
  return `${process.pid}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Attempts to acquire a globally-shared slot, polling until one frees up
 * or ACQUIRE_TIMEOUT_MS elapses. Returns the token to pass to release() on
 * success, or null on timeout (the semaphore is genuinely at capacity
 * across every instance — see executionQueue.js for how that's surfaced).
 */
export async function acquire(redis) {
  const deadline = Date.now() + ACQUIRE_TIMEOUT_MS;
  const token = makeToken();

  while (true) {
    const now = Date.now();
    const acquired = await redis.eval(
      ACQUIRE_SCRIPT,
      1,
      SEMAPHORE_KEY,
      now,
      now + LEASE_MS,
      MAX_CONCURRENT,
      token
    );
    if (acquired === 1) return token;

    if (Date.now() + POLL_INTERVAL_MS > deadline) return null;
    await sleep(POLL_INTERVAL_MS);
  }
}

/** Frees a slot early rather than waiting for its lease to expire. */
export async function release(redis, token) {
  if (!token) return;
  try {
    await redis.zrem(SEMAPHORE_KEY, token);
  } catch (err) {
    // Not fatal — the lease's own TTL (LEASE_MS) still bounds how long
    // this slot can be held, so a failed explicit release just means it
    // self-expires a little later instead of freeing up immediately.
    logger.warn({ err }, "[Judge0Queue] Redis release failed — slot will self-expire via its lease");
  }
}
