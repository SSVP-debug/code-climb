import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/authContext";
import { useAppContext } from "../../hooks/useAppContext";

export default function RoleRoute({ allowedRoles, children }) {
  const { user, loading } = useContext(AuthContext);
  const { role, isBackendReady } = useAppContext();

  if (loading) return null;

  if (!user) {
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
  if (!isBackendReady) return null;

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}