import { useAuth } from "../context/authContext";
import { Navigate, useLocation } from "react-router-dom";
import { buildLoginRedirect } from "../utils/authRedirect";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Firebase is still resolving the persisted session.
  // Show a spinner — do NOT redirect yet. Redirecting here would kick
  // logged-in users to /login on every page refresh.
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-[var(--theme-primary,#2dd4bf)] rounded-full animate-spin" />
      </div>
    );
  }

  // Firebase has resolved — no user means not authenticated.
  if (!user) {
    // Gate 3 audit, P0-1: preserve the page the person was trying to reach
    // (e.g. a shared contest link) as ?next= so LoginPage can send them
    // back here after they sign in, instead of always landing on the
    // role's generic default. Same pattern as ThemeGate's ?next=.
    // `replace` prevents this redirect from being added to browser history.
    return <Navigate to={buildLoginRedirect(location.pathname + location.search)} replace />;
  }

  return children;
}

export default ProtectedRoute;