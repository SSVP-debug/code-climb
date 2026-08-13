import { useEffect, useState } from "react";

/**
 * useOnlineStatus — tracks browser connectivity via navigator.onLine plus
 * the window `online`/`offline` events.
 *
 * This is a real connectivity signal, not a network-request-level one:
 * it tells you the OS/browser thinks there's no network interface up
 * (e.g. airplane mode, wifi dropped), which is a distinct failure mode
 * from "the API returned an error" — those still need their own
 * loading/error/retry handling (see AsyncState.jsx). This hook exists so
 * the app can show one honest, app-wide "you're offline" banner instead
 * of every fetch call independently guessing at the same thing from a
 * generic "Network Error" message.
 *
 * SSR-safe: `navigator` is guarded so this never throws during any
 * non-browser render (tests, etc.) — defaults to `true` (online) when
 * `navigator` isn't available, since assuming connectivity is the safer
 * default (never blocks the UI on an environment that simply lacks the API).
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

export default useOnlineStatus;
