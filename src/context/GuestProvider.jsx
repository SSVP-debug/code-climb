import { useCallback, useMemo, useState } from "react";
import { GuestContext } from "./GuestContextObject";
import { useAuth } from "../hooks/useAuth";

// Guest Mode architecture.
//
// This is deliberately the ONLY place "guest" client-side state lives.
// Every other guest-aware component (ProtectedRoute, RoleRoute, AppContext,
// AuthGate, Navbar, ...) reads it through useGuest()/useIdentity() rather
// than keeping its own flag — see hooks/useIdentity.js for how this
// composes with AuthContext into the single
//   loading / authenticated / guest / unauthenticated
// identity the Guest Mode spec calls for.
//
// What this intentionally does NOT do:
//   - No Firebase Anonymous Auth, no Firebase user of any kind.
//   - No network call, no Mongo User document, no server-side session.
//   - No writes anywhere except sessionStorage (browser-local, cleared when
//     the tab/session ends — "session-scoped" per the approved spec).
//
// VALID_PORTALS mirrors utils/roleRedirect.js's VALID_PORTAL_ROLES, but is
// kept as its own small const rather than importing that module — that
// file's map is about "where does an authenticated ROLE land", a genuinely
// different concern (guests are never assigned a User.role at all).
const VALID_PORTALS = ["student", "recruiter", "tpo"];

const STORAGE_KEY = "codeclub_guest_portal";

function readStoredPortal() {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    return VALID_PORTALS.includes(value) ? value : null;
  } catch {
    // sessionStorage can throw in some locked-down/private-browsing
    // contexts — guest mode should degrade to "not persisted across a
    // refresh" rather than crash the app.
    return null;
  }
}

function writeStoredPortal(portal) {
  try {
    if (portal) {
      sessionStorage.setItem(STORAGE_KEY, portal);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Same rationale as readStoredPortal — non-fatal.
  }
}

export function GuestProvider({ children }) {
  const { user } = useAuth();
  const [guestPortal, setGuestPortal] = useState(readStoredPortal);

  // Guest → authenticated transition: the moment a real Firebase session
  // appears (sign-in completes), guest state is cleared unconditionally.
  // This is the single source of truth for that transition — nothing else
  // needs to remember to call exitGuestMode() after login.
  //
  // Derived during render rather than in a useEffect (same "adjust state
  // during render, not in an effect" pattern context/appContext.jsx uses
  // for its own guest branch, and WorkspacePanel.jsx uses for forceTab):
  // the value exposed below (isGuest/guestPortal) already nulls itself
  // out the instant `user` is truthy regardless of this internal
  // `guestPortal` state, so there's no correctness gap for a consumer
  // reading the context — this only exists to keep the internal state +
  // sessionStorage from going stale for next time.
  const [appliedUser, setAppliedUser] = useState(user);
  if (user !== appliedUser) {
    setAppliedUser(user);
    if (user && guestPortal) {
      setGuestPortal(null);
      writeStoredPortal(null);
    }
  }

  const enterGuestMode = useCallback((portal) => {
    if (!VALID_PORTALS.includes(portal)) {
      console.warn(`[GuestProvider] Ignoring invalid guest portal: ${portal}`);
      return;
    }
    setGuestPortal(portal);
    writeStoredPortal(portal);
  }, []);

  const exitGuestMode = useCallback(() => {
    setGuestPortal(null);
    writeStoredPortal(null);
  }, []);

  const value = useMemo(
    () => ({
      isGuest: Boolean(guestPortal) && !user,
      guestPortal: user ? null : guestPortal,
      enterGuestMode,
      exitGuestMode,
    }),
    [guestPortal, user, enterGuestMode, exitGuestMode]
  );

  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
}

export default GuestProvider;
