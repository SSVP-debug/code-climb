/**
 * Redis client — optional caching backend.
 *
 * Mirrors the MongoDB pattern already used in this codebase (see
 * config/db.js / server.js): if REDIS_URL isn't set, or the connection
 * fails, the app must keep working — just without cross-instance caching.
 * backend/utils/cache.js falls back to a local in-memory cache in that case.
 *
 * We lazy-import ioredis so a missing REDIS_URL never even touches the
 * network — no connection attempt, no retry storm in logs.
 */
import { logger } from "./logger.js";

let client = null;
let connectionAttempted = false;

export async function getRedisClient() {
  if (connectionAttempted) return client;
  connectionAttempted = true;

  const url = process.env.REDIS_URL;
  if (!url) {
    logger.warn(
      "[Redis] REDIS_URL not set — caching falls back to per-instance " +
        "in-memory cache. Fine for a single Railway instance; if you scale " +
        "to multiple instances, set REDIS_URL so caches stay consistent."
    );
    return null;
  }

  try {
    const { default: Redis } = await import("ioredis");

    const redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      // Don't let ioredis's default infinite-retry-with-backoff hang the
      // process or spam logs — a handful of attempts then give up and let
      // the in-memory fallback in cache.js take over.
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
      lazyConnect: true,
    });

    redis.on("error", (err) => {
      logger.warn({ err }, "[Redis] Connection error — falling back to in-memory cache");
    });

    await redis.connect();
    client = redis;
    return client;
  } catch (err) {
    logger.warn({ err }, "[Redis] Failed to connect — falling back to in-memory cache");
    return null;
  }
}