/**
 * judgeErrorTaxonomy.js
 *
 * Added during the execution-contract audit (Fri Aug 13 "single-number"
 * postmortem). Before this, src/services/judgeService.js's catch blocks
 * collapsed EVERY failure — a 400 validation error, a 401/expired
 * session, a rate limit, and a genuinely-down Judge0 — into the same
 * generic string, which the UI then rendered as "Runner Unavailable"
 * regardless of cause. That's exactly what made the schema-drift bug
 * hard to diagnose from the browser console: a client-side bug (missing
 * required field) looked identical to an infrastructure outage.
 *
 * `apiFetch` (src/services/api.js) already attaches `.status` to any
 * error it throws for a non-2xx response — this just maps that status
 * into a `{ kind, message }` pair a UI component can branch on, instead
 * of every caller re-implementing its own ad-hoc status check.
 *
 * `kind` values (mirrors the taxonomy WorkspacePanel.jsx /
 * SubmissionResultBanner.jsx already render distinct headers for):
 *   "config"     — the request itself was invalid (400). This is a
 *                  frontend/backend contract bug, not a runtime failure —
 *                  it should never be shown as "Runner Unavailable".
 *   "auth"       — 401/403. Session/permission problem, not the judge.
 *   "rate_limit" — 429.
 *   "infra"      — everything else: network failure (no response at
 *                  all), 5xx, or an unrecognized status. This is the
 *                  only bucket that should ever say "Runner Unavailable".
 */

const KIND_LABELS = {
  config: "Execution configuration error",
  auth: "Authentication required",
  rate_limit: "Rate limited",
  infra: "Runner Unavailable",
};

/**
 * @param {Error & { status?: number, body?: any }} error - as thrown by apiFetch
 * @returns {{ kind: "config" | "auth" | "rate_limit" | "infra", message: string }}
 */
export function classifyJudgeError(error) {
  const status = error?.status;

  // No status at all means apiFetch never got a response back (network
  // failure, DNS, CORS, the backend process being down entirely) — that
  // is a real infra problem, not a request-shape problem.
  if (status === undefined) {
    return {
      kind: "infra",
      message: "Execution service temporarily unavailable. Please try again in a moment.",
    };
  }

  if (status === 400) {
    return {
      kind: "config",
      message: `Execution configuration error: ${error.message}`,
    };
  }

  if (status === 401 || status === 403) {
    return {
      kind: "auth",
      message: error.message || "You don't have permission to run this problem.",
    };
  }

  if (status === 404) {
    // Problem not found / contest-gated — a request-shape/identity
    // problem, same bucket as 400 rather than "infra".
    return {
      kind: "config",
      message: error.message || "This problem could not be found.",
    };
  }

  if (status === 429) {
    return {
      kind: "rate_limit",
      message: error.message || "Too many run requests. Please wait a moment and try again.",
    };
  }

  // 5xx and anything else unrecognized: genuine backend/runner trouble.
  return {
    kind: "infra",
    message: "Execution service temporarily unavailable. Please try again in a moment.",
  };
}

/** Display label for a taxonomy `kind` — used by DebugPanel headers. */
export function labelForJudgeErrorKind(kind) {
  return KIND_LABELS[kind] ?? KIND_LABELS.infra;
}