import { useEffect, useRef, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

// How long the "Back online" confirmation stays visible before
// disappearing on its own, in milliseconds.
const RECONNECT_MESSAGE_MS = 3000;

/**
 * OfflineBanner — app-wide connectivity state, mounted once near the root
 * (see App.jsx, alongside AnnouncementBanner/AdminPreviewBanner).
 *
 * Fills the gap flagged in the state-coverage audit: individual pages only
 * ever surfaced connectivity loss as a generic "Network Error, try again"
 * toast from whichever fetch happened to fail first — no shared, honest
 * "you're offline" state existed anywhere. This renders a fixed banner the
 * moment the browser reports it has lost its network interface (see
 * useOnlineStatus), and a brief self-dismissing "Back online" confirmation
 * when it returns — so recovery is visible, not just inferred from things
 * quietly starting to work again.
 *
 * Deliberately does NOT retry any in-flight requests itself — that stays
 * the responsibility of whatever hook/component owns that request (see
 * AsyncState's retry prop, ErrorBanner's onRetry). This is purely a status
 * indicator.
 *
 * The "just came back online" confirmation is driven by its own
 * window "online"/"offline" listeners rather than by diffing
 * useOnlineStatus()'s value during render — every setState call below
 * happens inside an event-handler callback (or a setTimeout inside one),
 * never synchronously in the effect body, matching the pattern this
 * codebase already uses elsewhere for async-sourced state (see
 * AnnouncementBanner.jsx's comment on the same rule,
 * react-hooks/set-state-in-effect) and avoiding ref-during-render, which
 * this codebase's stricter react-compiler lint rules also disallow.
 */
function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const dismissTimerRef = useRef(null);

  useEffect(() => {
    function handleOnline() {
      setShowReconnected(true);

      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => {
        setShowReconnected(false);
      }, RECONNECT_MESSAGE_MS);
    }

    function handleOffline() {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      setShowReconnected(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="assertive"
        className="w-full bg-verdict-reject/15 border-b border-verdict-reject/30 text-verdict-reject px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium"
      >
        <WifiOff size={15} strokeWidth={2} aria-hidden="true" />
        You're offline. Some features won't work until your connection comes back.
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="w-full bg-verdict-accept/15 border-b border-verdict-accept/30 text-verdict-accept px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium"
      >
        <Wifi size={15} strokeWidth={2} aria-hidden="true" />
        Back online.
      </div>
    );
  }

  return null;
}

export default OfflineBanner;
