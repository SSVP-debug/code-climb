import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

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
    window.location.href = "/login?reason=session_expired";
    // Throw anyway so any in-progress async operation stops cleanly
    throw new Error("Session expired. Please sign in again.");
  }

  if (!response.ok) {
    const text = await response.text();
    let message = text;

    try {
      const json = JSON.parse(text);
      message = json.error || json.message || text;
    } catch {
      // keep raw text if response is not JSON
    }

    throw new Error(message || `Request failed (${response.status})`);
  }

  if (response.status === 204) return null;

  return response.json();
}
