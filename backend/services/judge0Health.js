// Fest Readiness Audit, P1-1: this module's counters existed and were
// exposed at GET /api/health/compiler (see controllers/healthController.js),
// but nothing in the actual execution path ever called updateJudge0Health()
// — so the endpoint always reported zeroed counters regardless of Judge0's
// real state. Fixed by wiring recordJudge0Success()/recordJudge0Failure()
// into compilerController.js's fetchJudge0 — the one place that actually
// talks to Judge0 over the network.
//
// `circuitOpen` here is informational only — it reflects "the last 5
// consecutive Judge0 calls were all infrastructure failures," nothing more.
// It does NOT gate or reject requests (that would be an actual circuit
// breaker, a behavior change well beyond "make the health counters
// truthful" — intentionally not built here; see the Fest Readiness P0/P1
// implementation report for that scoping call). It exists purely so
// GET /api/health/compiler can surface "Judge0 looks like it's currently
// down" as a single boolean, without an operator having to do arithmetic
// on requests/successes/failures themselves.
const CONSECUTIVE_FAILURES_FOR_CIRCUIT_SIGNAL = 5;

const health = {
  requests: 0,
  successes: 0,
  failures: 0,
  consecutiveFailures: 0,
  circuitOpen: false,
  circuitOpenedAt: null,
};

export function getJudge0Health() {
  return {
    ...health,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Call after a Judge0 HTTP interaction actually succeeds (a real response
 * came back, decoded fine) — regardless of what the USER's code did.
 * "Wrong Answer" / "Compilation Error" / "Runtime Error" / "Time Limit
 * Exceeded" are all valid judge outcomes that reached this point
 * successfully and must be recorded as a success here, not a failure —
 * see fetchJudge0's call site for where that distinction is drawn.
 */
export function recordJudge0Success() {
  health.requests++;
  health.successes++;
  health.consecutiveFailures = 0;
  if (health.circuitOpen) {
    health.circuitOpen = false;
    health.circuitOpenedAt = null;
  }
}

/**
 * Call only for genuine Judge0 infrastructure failures — network errors,
 * timeouts, malformed responses, or provider 5xx, after all retries in
 * fetchJudge0 are exhausted. Never for a normal graded outcome.
 */
export function recordJudge0Failure() {
  health.requests++;
  health.failures++;
  health.consecutiveFailures++;
  if (
    !health.circuitOpen &&
    health.consecutiveFailures >= CONSECUTIVE_FAILURES_FOR_CIRCUIT_SIGNAL
  ) {
    health.circuitOpen = true;
    health.circuitOpenedAt = new Date().toISOString();
  }
}

/** Retained for backward compatibility — no current caller. */
export function updateJudge0Health(update) {
  Object.assign(health, update);
}
