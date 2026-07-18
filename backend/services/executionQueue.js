import { getRedisClient } from "../config/redis.js";
import { logger } from "../config/logger.js";
import { acquire as redisAcquire, release as redisRelease } from "./redisExecutionQueue.js";
import { enqueueExecution as directExecution } from "./directExecutionQueue.js";

export async function enqueueExecution(job) {
  const redis = await getRedisClient();
  if (!redis) {
    return directExecution(job);
  }

  let token;
  try {
    token = await redisAcquire(redis);
  } catch (err) {
    // Redis was reachable when we connected, but this particular acquire
    // call failed (a transient network blip, a Lua eval error, etc). Fail
    // open to the in-process semaphore for this one job rather than
    // blocking Judge0 execution entirely on a Redis hiccup — consistent
    // with the "never let an optional dependency take down execution"
    // pattern already used for Mongo/Redis/Sentry at boot.
    logger.warn(
      { err },
      "[Judge0Queue] Redis acquire failed — falling back to in-process semaphore for this job"
    );
    return directExecution(job);
  }

  if (!token) {
    // Genuinely at capacity across every instance — surface this as an
    // error rather than blocking forever, so the route handler can return
    // a clear message instead of the request just timing out. (The old
    // in-process semaphore had no timeout and would wait indefinitely;
    // that was safe for one process, but waiting indefinitely on a
    // cross-instance queue risks piling up requests with no visibility.)
    throw new Error(
      "Judge0 is at capacity across all instances right now — please try again in a moment."
    );
  }

  try {
    return await job();
  } finally {
    await redisRelease(redis, token);
  }
}
