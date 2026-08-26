import { useAuth } from "./useAuth";
import { useGuest } from "./useGuest";

// Guest Mode architecture — the "Identity Layer":
//
//   Firebase Auth
//     ↓
//   AuthContext        (hooks/useAuth.js — unchanged, still the source of
//                        truth for the real Firebase session)
//     ↓
//   Identity Layer      (this hook — pure composition, holds no state of
//                        its own)
//     ↓
//   authenticated / guest / unauthenticated / loading
//
// This is the hook most guest-aware UI should reach for instead of
// scattering `if (isGuest) ... else if (!user) ...` throughout the app —
// see AuthGate.jsx, Navbar.jsx, ProtectedRoute.jsx, RoleRoute.jsx for the
// existing consumers.
//
// status:
//   "loading"       — Firebase's initial onAuthStateChanged hasn't fired
//                      yet; equivalent to useAuth().loading.
//   "authenticated" — a real Firebase session exists (guest state is force
//                      -cleared the moment this becomes true — see
//                      GuestProvider.jsx's effect).
//   "guest"         — no Firebase session, but a guest portal was
//                      explicitly entered (PortalPage's "Continue as
//                      Guest").
//   "unauthenticated" — no Firebase session and no active guest portal.
export function useIdentity() {
  const { user, loading } = useAuth();
  const { isGuest, guestPortal } = useGuest();

  let status = "unauthenticated";
  if (loading) {
    status = "loading";
  } else if (user) {
    status = "authenticated";
  } else if (isGuest) {
    status = "guest";
  }

  return {
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    isGuest: status === "guest",
    isUnauthenticated: status === "unauthenticated",
    user,
    guestPortal,
  };
}
