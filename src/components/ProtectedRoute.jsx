import { useAuth } from "../hooks/useAuth";
import { useGuest } from "../hooks/useGuest";
import { Navigate, useLocation } from "react-router-dom";
import { buildLoginRedirect } from "../utils/authRedirect";
import DailyQuizGate from "../routes/DailyQuizGate";

// Guest Mode: `guestPortal` is an optional prop naming which portal
// (student | recruiter | tpo) this route is explorable for as a guest —
// see hooks/useGuest.js / context/GuestProvider.jsx. Routes that must
// always require a real account (Profile, Settings, Submit's own
// persistence path, etc.) simply omit it and this behaves exactly as
// before.
function ProtectedRoute({ children, guestPortal = null }) {
  const { user, loading } = useAuth();
  const { isGuest, guestPortal: activeGuestPortal } = useGuest();
  const location = useLocation();

  // Firebase is still resolving the persisted session.
  // Show a spinner — do NOT redirect yet. Redirecting here would kick
  // logged-in users to /login on every page refresh.
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--border-strong)] border-t-[var(--theme-primary,#2dd4bf)] rounded-full animate-spin" />
      </div>
    );
  }

  // Firebase has resolved — no user means not authenticated. A guest
  // session exploring the matching portal is let through instead of being
  // redirected to /login — this is the entire guest bypass for this
  // route; DailyQuizGate below is still skipped for guests (see comment
  // there) since it's an authenticated-progress feature with nothing to
  // check for someone with no account.
  if (!user) {
    if (guestPortal && isGuest && activeGuestPortal === guestPortal) {
      return children;
    }

    // Gate 3 audit, P0-1: preserve the page the person was trying to reach
    // (e.g. a shared contest link) as ?next= so LoginPage can send them
    // back here after they sign in, instead of always landing on the
    // role's generic default. Same pattern as ThemeGate's ?next=.
    // `replace` prevents this redirect from being added to browser history.
    return <Navigate to={buildLoginRedirect(location.pathname + location.search)} replace />;
  }

  // Daily Quiz Gate (see DailyQuizGate.jsx): every genuinely protected
  // page already routes through ProtectedRoute, so this is the single,
  // centralized place to enforce "today's quiz must be completed before
  // reaching protected content" — no per-page wiring, and public routes
  // that don't use ProtectedRoute are never affected.
  return <DailyQuizGate>{children}</DailyQuizGate>;
}

export default ProtectedRoute;