import { useEffect, useState } from "react";

const SESSION_KEY = "cc_entry_shown";

/**
 * CommandCenterEntry — JARVIS pass, spec §2: "System access granted" reveal
 * on entering the Command Center.
 *
 * Deliberately NOT a gate: AdminLayout renders its real content
 * immediately and in parallel — this is a translucent overlay on top that
 * fades itself out, never something the admin waits on. Per spec §1/§18/
 * §23 ("never wait just to watch an animation", "no cinematic intro
 * lasting several seconds"):
 *   - Plays once per browser session (sessionStorage flag), not on every
 *     navigation back to /admin.
 *   - Skipped entirely under prefers-reduced-motion.
 *   - Dismissible instantly on click/keypress.
 *   - Total runtime ~900ms even when left alone.
 * No fake diagnostics/loading copy — just the real product name and the
 * real fact that access was already just verified by the route guard that
 * rendered this layout at all.
 */
export default function CommandCenterEntry() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
    try {
      return sessionStorage.getItem(SESSION_KEY) !== "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!visible) return;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Private-browsing / storage-disabled: fine, it just replays next load.
    }
    const timer = setTimeout(() => setVisible(false), 900);
    function handleKeyDown(e) {
      if (e.key === "Escape") setVisible(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible]);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--background)] animate-fadeIn cursor-pointer"
      style={{ animationDuration: "0.15s" }}
      onClick={dismiss}
      role="status"
      aria-live="polite"
    >
      <div className="text-center">
        <p className="text-[11px] font-mono-ui uppercase tracking-[0.3em] text-verdict-accept mb-3 animate-fadeIn">
          System access granted
        </p>
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
          Code Club Command Center
        </h1>
      </div>
    </div>
  );
}