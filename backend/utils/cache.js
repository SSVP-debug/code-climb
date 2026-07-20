/**
 * Shared cache helper used by problemController, leaderboard, and
 * publicProfileController.
 *
 * Replaces the hand-rolled module-level `let cache = null` pattern that
 * previously existed independently in each of those three files. That
 * pattern has a real bug at scale: Railway can run multiple instances of
 * this backend behind a load balancer, and each instance had its own
 * cache — so a cache "hit" on instance A told you nothing about whether
 * instance B had fresh data. Two users hitting different instances could
 * see different leaderboard rankings for up to 5 minutes.
 *
 * getOrSetCache() fixes that by preferring Redis (shared across all
 * instances) when REDIS_URL is configured, and transparently falling back
 * to the old per-instance in-memory behavior when it isn't — so a single
 * Railway instance with no Redis configured behaves exactly as before.
 */

import { getRedisClient } from "../config/redis.js";
import { logger } from "../config/logger.js";

// In-memory fallback store: Map<key, { value, expiresAt }>
const memoryStore = new Map();

function memoryGet(key) {
  const entry = memoryStore.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return undefined;
  }
  return entry.value;
}

function memorySet(key, value, ttlSeconds) {
  memoryStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function memoryDelete(key) {
  memoryStore.delete(key);
}

function memoryDeletePrefix(prefix) {
  for (const key of memoryStore.keys()) {
    if (key.startsWith(prefix)) memoryStore.delete(key);
  }
}

/**
 * Fetch `key` from cache, or call `fetchFn()` and cache the result for
 * `ttlSeconds`. Returns { value, cacheStatus } where cacheStatus is
 * "HIT" | "MISS" | "STALE" (STALE = fetchFn threw, serving last-known-good).
 *
 * fetchFn's result must be JSON-serializable (it's JSON.stringify'd for
 * Redis; the in-memory path stores the object directly).
 */
export async function getOrSetCache(key, ttlSeconds, fetchFn) {
  const redis = await getRedisClient();

  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached !== null) {
        return { value: JSON.parse(cached), cacheStatus: "HIT" };
      }
    } catch (err) {
      logger.warn({ err, key }, "[Cache] Redis GET failed, falling through to fetch");
    }

    try {
      const value = await fetchFn();
      redis.set(key, JSON.stringify(value), "EX", ttlSeconds).catch((err) => {
        logger.warn({ err, key }, "[Cache] Redis SET failed");
      });
      return { value, cacheStatus: "MISS" };
    } catch (fetchErr) {
      // fetchFn failed (e.g. DB hiccup) — try to serve whatever's still in
      // Redis even if we couldn't confirm freshness above (race condition
      // between the GET and here is acceptable for a stale-fallback path).
      try {
        const stale = await redis.get(key);
        if (stale !== null) return { value: JSON.parse(stale), cacheStatus: "STALE" };
      } catch {
        /* fall through to rethrow below */
      }
      throw fetchErr;
    }
  }

  // ── No Redis — in-memory fallback (single-instance behavior) ───────────
  const memCached = memoryGet(key);
  if (memCached !== undefined) {
    return { value: memCached, cacheStatus: "HIT" };
  }

  try {
    const value = await fetchFn();
    memorySet(key, value, ttlSeconds);
    return { value, cacheStatus: "MISS" };
  } catch (fetchErr) {
    const stale = memoryStore.get(key);
    if (stale) return { value: stale.value, cacheStatus: "STALE" };
    throw fetchErr;
  }
}

/** Invalidate a single cache key, in both Redis and the memory fallback. */
export async function invalidateCache(key) {
  memoryDelete(key);
  const redis = await getRedisClient();
  if (redis) {
    try {
      await redis.del(key);
    } catch (err) {
      logger.warn({ err, key }, "[Cache] Redis DEL failed");
    }
  }
}

/**
 * Invalidate every key starting with `prefix`. Used for the college
 * leaderboard cache, which is keyed per-domain (`leaderboard:college:<domain>`)
 * — a single XP change should invalidate all of them since we don't know
 * which domain the user belongs to without an extra lookup.
 */
export async function invalidateCachePrefix(prefix) {
  memoryDeletePrefix(prefix);
  const redis = await getRedisClient();
  if (redis) {
    try {
      await scanAndDelete(redis, `${prefix}*`);
    } catch (err) {
      logger.warn({ err, prefix }, "[Cache] Redis prefix DEL failed");
    }
  }
}

/**
 * Walks the keyspace with SCAN instead of KEYS. KEYS is O(N) over the
 * *entire* keyspace and blocks Redis's single-threaded event loop for the
 * whole call — fine when there are a few hundred keys, a real production
 * incident once the keyspace grows (every other client's commands queue up
 * behind it). SCAN does the same job in small, cheap, non-blocking batches
 * via a cursor, at the cost of needing a loop instead of one call.
 */
async function scanAndDelete(redis, pattern) {
  let cursor = "0";
  do {
    const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
    cursor = nextCursor;
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } while (cursor !== "0");
}