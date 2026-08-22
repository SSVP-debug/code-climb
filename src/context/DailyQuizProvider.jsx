import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAppContext } from "../hooks/useAppContext";
import { getDailyQuizStatus, completeDailyQuiz } from "../services/dailyQuizService";
import { DailyQuizContext } from "./DailyQuizContextObject";

/**
 * DailyQuizProvider — owns the server-backed Daily Quiz Gate's status.
 *
 * Mounted once, above the router (see App.jsx), so the status is fetched
 * once per authenticated session/day and shared across every route —
 * navigating Dashboard -> Problems -> Club after already completing
 * today's quiz doesn't re-trigger a status check or a loading flash on
 * each route change. `<ProtectedRoute>` (via `useDailyQuizStatus`) is what
 * actually acts on this status and decides what to render; this provider
 * only fetches and caches.
 *
 * Scope, deliberately: this is consumed ONLY by `ProtectedRoute`, so
 * public routes (landing page, /login, /portal, /theme-selection, etc.)
 * are completely unaffected by quiz status, even for an authenticated
 * user who hasn't done today's quiz yet — the gate only ever appears in
 * place of an actual protected page's content, never over marketing/
 * public/pre-app-setup routes. (Earlier version of this gate wrapped the
 * entire <Routes> tree directly and gated every route indiscriminately;
 * moved here specifically to fix that.)
 *
 * Admins are exempted once role has hydrated — same precedent as
 * ThemeGate exempting admin from the theme-selection gate.
 */
export default function DailyQuizProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { role, isBackendReady } = useAppContext();

  // "loading" | "required" | "unlocked" | "error"
  const [status, setStatus] = useState("loading");
  const [retryToken, setRetryToken] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState(null);

  const isAdmin = isBackendReady && role === "admin";

  useEffect(() => {
    // Nothing to check until auth has resolved to a real user and role
    // has hydrated (same race ThemeGate guards against, so the admin
    // exemption below doesn't fire on the "student" default for one
    // render before the real role comes back). Admin skips the fetch
    // entirely — see `effectiveStatus` below.
    if (authLoading || !user?.uid || !isBackendReady || isAdmin) return undefined;

    let cancelled = false;

    async function checkStatus() {
      setStatus("loading");
      try {
        const data = await getDailyQuizStatus();
        if (cancelled) return;
        setStatus(data.required ? "required" : "unlocked");
      } catch {
        // Fail closed — never silently unlock the app on a failed status
        // check (spec §12). Stays in an error/retry state instead.
        if (!cancelled) setStatus("error");
      }
    }

    checkStatus();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.uid, isBackendReady, isAdmin, retryToken]);

  async function completeQuiz() {
    setCompleting(true);
    setCompleteError(null);
    try {
      await completeDailyQuiz();
      setStatus("unlocked");
    } catch (err) {
      // Completion failed — keep the app locked and let the person retry
      // (spec §12/§14 "Completion failure").
      setCompleteError(err.message || "Couldn't save your quiz completion. Please try again.");
    } finally {
      setCompleting(false);
    }
  }

  // Derived, not stored — avoids ever calling setState synchronously
  // inside the effect above just to special-case admin.
  const effectiveStatus = isAdmin ? "unlocked" : status;

  const value = {
    status: effectiveStatus,
    isBackendReady,
    retry: () => setRetryToken((t) => t + 1),
    completeQuiz,
    completing,
    completeError,
  };

  return <DailyQuizContext.Provider value={value}>{children}</DailyQuizContext.Provider>;
}
