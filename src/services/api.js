import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { buildLoginRedirect } from "../utils/authRedirect";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * warmBackend — fire-and-forget ping to start Render's cold-start clock as
 * early as possible: at app mount (see App.jsx), before Firebase auth has
 * resolved and regardless of which route the user lands on. Deliberately
 * NOT apiFetch, which requires `auth.currentUser` and throws otherwise —
 * this needs to work with no user at all. /api/health is genuinely public
 * (see backend/server.js), so no token is needed either way.
 *
 * This only nudges the backend awake sooner; it is not what the UI waits
 * on. AppContext's `isBackendReady` (driven by the real /api/init call
 * once a user exists) is the actual readiness signal — see its comment for
 * why. Errors here are swallowed on purpose: a failed warm-up ping isn't
 * something the user should ever see.
 */
export function warmBackend() {
  fetch(`${API_URL}/api/health`).catch(() => {});
}

/**
 * fetchAnnouncement — public, no-auth-required call to
 * GET /api/announcement (plan 009). Deliberately plain `fetch`, not
 * apiFetch, for the same reason warmBackend() above is: this needs to
 * work for logged-out visitors too, and apiFetch throws without a
 * signed-in Firebase user. Swallows errors to `{ active: false }` — a
 * failed announcement fetch should never be visible to the user, it
 * should just mean no banner shows.
 */
export async function fetchAnnouncement() {
  try {
    const res = await fetch(`${API_URL}/api/announcement`);
    if (!res.ok) return { text: "", active: false };
    return await res.json();
  } catch {
    return { text: "", active: false };
  }
}

function doRequest(path, options, token) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

export async function apiFetch(path, options = {}) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "You are not logged in. Please refresh the page and try again."
    );
  }

  let token;
  try {
    // getIdToken(false) — use Firebase's cached token if it's still valid,
    // instead of forcing a refresh (a network round trip to Firebase's
    // token endpoint) on every single API call. Tokens last ~1 hour, so
    // this makes almost every call free of that extra round trip.
    // If the cached token has actually expired, the 401 handling below
    // retries once with a forced refresh before treating the session as
    // dead — so we still never surface a stale-token 401 to the user.
    token = await user.getIdToken(false);
  } catch (err) {
    console.error("[apiFetch] Token fetch failed:", err.message);
    throw new Error(
      "Your session could not be refreshed. Please sign in again."
    );
  }

  let response = await doRequest(path, options, token);

  if (response.status === 401) {
    // A 401 here is ambiguous: it could mean the cached token really did
    // expire (fixable — force a refresh and retry once), or that the
    // backend rejected an otherwise-valid token for some unrelated reason
    // (a transient hiccup, not fixable by refreshing, but harmless to
    // retry anyway). Only treat the session as dead if it's still a 401
    // after a genuinely fresh token.
    try {
      token = await user.getIdToken(true);
      response = await doRequest(path, options, token);
    } catch (err) {
      console.warn("[apiFetch] Forced token refresh after 401 failed:", err.message);
    }
  }

  // 401 persisted even with a fresh token: the backend really doesn't
  // consider this session valid. Force sign-out + redirect so the user
  // gets a clean login on next attempt. We redirect before throwing so UI
  // components don't need to handle this case.
  if (response.status === 401) {
    console.warn("[apiFetch] 401 persisted after token refresh — signing out and redirecting.");
    await signOut(auth);
    // Gate 3 audit, P0-1: preserve the page the person was on (e.g. a
    // contest they were mid-session on) so they land back on it after
    // re-authenticating, instead of always on the role's generic default.
    window.location.href = buildLoginRedirect(
      window.location.pathname + window.location.search,
      { reason: "session_expired" }
    );
    // Throw anyway so any in-progress async operation stops cleanly
    throw new Error("Session expired. Please sign in again.");
  }

  if (!response.ok) {
    const text = await response.text();
    let message = text;
    let body = null;

    try {
      body = JSON.parse(text);
      message = body.error || body.message || text;
    } catch {
      // keep raw text if response is not JSON
    }

    // Audit fix: previously only the string message survived past this
    // point, so structured fields on error responses — most importantly
    // the 402 premium-gate body's `upgradeUrl`/`currentPlan`
    // (backend/middleware/premiumGate.js) — were silently discarded.
    // Callers that only read `.message` are unaffected; callers that want
    // the extra context (e.g. an upgrade CTA) can now read `.status`/`.body`.
    const err = new Error(message || `Request failed (${response.status})`);
    err.status = response.status;
    err.body = body;
    throw err;
  }

  if (response.status === 204) return null;

  return response.json();
}