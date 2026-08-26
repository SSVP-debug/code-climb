import { useContext } from "react";
import { GuestContext } from "../context/GuestContextObject";

// Convenience hook mirroring hooks/useAuth.js's pattern. Throws a clear
// error if used outside GuestProvider instead of silently returning null.
//
// Usage: const { isGuest, guestPortal, enterGuestMode, exitGuestMode } = useGuest();
//
// Most components should prefer useIdentity() (hooks/useIdentity.js),
// which composes this with useAuth() into the single
// loading/authenticated/guest/unauthenticated status the Guest Mode spec
// calls for. Reach for useGuest() directly only when you specifically need
// enterGuestMode/exitGuestMode (e.g. PortalPage's "Continue as Guest"
// links, or the "Sign in" exit in AvatarDropdown).
export function useGuest() {
  const context = useContext(GuestContext);

  if (!context) {
    throw new Error(
      "[useGuest] Must be used inside <GuestProvider>. " +
      "Did you wrap your app in main.jsx?"
    );
  }

  return context;
}
