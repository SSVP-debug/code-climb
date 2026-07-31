// authRedirect — single source of truth for "where was the person headed
// before they were sent to /login". Mirrors the ?next= pattern already used
// by ThemeGate.jsx for the theme-selection redirect, applied to the auth
// redirect that ProtectedRoute and the api.js 401 handler both trigger.
//
// Gate 3 audit, P0-1: previously neither of those redirects to /login ever
// preserved the intended destination, so a student following a contest link
// while logged out always landed on the generic post-login default (usually
// /dashboard) with no way back to the contest short of re-finding it.
//
// Encoding note: `path` is passed RAW (not pre-encoded) into
// URLSearchParams — it encodes on `.set()` and React Router's
// `useSearchParams().get()` (a thin wrapper over URLSearchParams) decodes
// on read. Callers must not additionally encodeURIComponent/decodeURIComponent
// the value themselves, or it will be double-encoded/decoded.

const NEXT_PARAM = "next";

/**
 * Builds the /login URL that preserves `path` (typically
 * `location.pathname + location.search`) as a `?next=` param. Any
 * additional query params (e.g. reason=session_expired) can be passed via
 * `extraParams` and are merged in alongside `next`.
 */
export function buildLoginRedirect(path, extraParams = {}) {
  const params = new URLSearchParams(extraParams);
  if (isSafeNextPath(path)) {
    params.set(NEXT_PARAM, path);
  }
  const qs = params.toString();
  return qs ? `/login?${qs}` : "/login";
}

/**
 * A `next` value is only honored if it's a same-app relative path.
 * Rejects absolute URLs (`https://evil.example`) and protocol-relative
 * URLs (`//evil.example`) so this can never be turned into an open
 * redirect via a crafted link.
 */
export function isSafeNextPath(path) {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//");
}

/**
 * Reads and validates the `next` param off a URLSearchParams instance
 * (e.g. from useSearchParams() on LoginPage). Returns null when absent
 * or unsafe, so callers can cleanly fall back to the role-based default.
 */
export function getSafeNextPath(searchParams) {
  const value = searchParams.get(NEXT_PARAM);
  return isSafeNextPath(value) ? value : null;
}
