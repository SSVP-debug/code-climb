/**
 * In-process semaphore for Judge0 execution concurrency — used automatically
 * whenever Redis isn't configured (see executionQueue.js's fallback logic).
 * Caps concurrency per Node process only; see redisExecutionQueue.js for the
 * cross-instance version and its own doc comment on why that one exists.
 *
 * Fest Readiness Audit, P1-3: this used to have an unbounded wait queue with
 * no acquire timeout — if Judge0 hung, requests would queue here forever
 * with no error surfaced, unlike the Redis path (which has always had
 * ACQUIRE_TIMEOUT_MS). Brought to equivalent behavior: waiting longer than
 * ACQUIRE_TIMEOUT_MS now fails cleanly with an actionable error, using the
 * same env var and default the Redis queue already uses.
 */

export const MAX_CONCURRENT = parseInt(process.env.JUDGE0_MAX_CONCURRENCY || "8", 10);

// Same env var / default as redisExecutionQueue.js's ACQUIRE_TIMEOUT_MS —
// intentionally shared, so switching Redis on or off for a given deployment
// doesn't silently change how long a caller is willing to wait.
export const ACQUIRE_TIMEOUT_MS = parseInt(process.env.JUDGE0_ACQUIRE_TIMEOUT_MS || "20000", 10);

let activeCount = 0;

// FIFO queue of pending waiters. Each entry holds its own settle/timer so a
// timed-out waiter can remove itself without disturbing anyone else's
// position in line.
const waitQueue = [];

function acquire() {
  if (activeCount < MAX_CONCURRENT) {
    activeCount++;
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const waiter = {};

    waiter.settle = () => {
      clearTimeout(waiter.timer);
      activeCount++;
      resolve();
    };

    waiter.timer = setTimeout(() => {
      const idx = waitQueue.indexOf(waiter);
      // Already granted a slot (release() shifted it out and called
      // settle() first) — nothing to do, avoid a spurious rejection racing
      // an already-successful acquire.
      if (idx === -1) return;
      waitQueue.splice(idx, 1);
      reject(
        new Error(
          "Judge0 is at capacity right now — please try again in a moment."
        )
      );
    }, ACQUIRE_TIMEOUT_MS);

    waitQueue.push(waiter);
  });
}

function release() {
  activeCount--;
  const next = waitQueue.shift();
  if (next) {
    next.settle();
  }
}

export async function enqueueExecution(job) {
  await acquire();
  try {
    return await job();
  } finally {
    release();
  }
}
