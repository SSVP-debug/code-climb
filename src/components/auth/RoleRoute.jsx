import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContextObject";
import { useAppContext } from "../../hooks/useAppContext";
import { useGuest } from "../../hooks/useGuest";

export default function RoleRoute({ allowedRoles, children }) {
  const { user, loading } = useContext(AuthContext);
  const { role, isBackendReady } = useAppContext();
  const { isGuest } = useGuest();

  if (loading) return null;

  // Guest Mode: a guest has no Firebase user, so this would otherwise
  // redirect to /login unconditionally below. Instead of a redirect, fall
  // through to the same allowedRoles check every authenticated caller
  // goes through — AppContext already sets `role` to the guest's chosen
  // portal the moment a guest session is active (see appContext.jsx's
  // hydrate effect), so `allowedRoles.includes(role)` below evaluates
  // correctly for a guest with no special-casing needed past this line.
  // A guest whose chosen portal doesn't match this route's allowedRoles
  // still correctly falls through to the /dashboard redirect below, same
  // as a real user with the wrong role — no separate guest denial path
  // needed.
  if (!user && !isGuest) {
    return <Navigate to="/login" replace />;
  }

  // `role` defaults to "student" until AppContext's /api/init hydrate
  // resolves (see appContext.jsx). On a fresh mount — e.g. the full-page
  // reload AdminPreviewBanner's exitImpersonation does to land back on
  // /admin — this component renders before that default is corrected,
  // so checking allowedRoles against it here would bounce a real admin
  // to /dashboard before their actual role ever loads in. Wait for
  // isBackendReady so the role check only runs against the resolved
  // value, same as Dashboard.jsx does for its own skeleton/data gate.
  // (A guest's isBackendReady is set true immediately — nothing to wait
  // for — see appContext.jsx, so this never blocks a guest.)
  if (!isBackendReady) return null;

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}