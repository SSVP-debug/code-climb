import { useEffect, useState } from "react";
import { AlertTriangle, Sparkles } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useAppContext } from "../hooks/useAppContext";
import Button from "../components/ui/Button";
import DailyQuickQuiz from "../components/onboarding/DailyQuickQuiz";
import { getDailyQuizStatus, completeDailyQuiz } from "../services/dailyQuizService";

/**
 * DailyQuizGuard — the mandatory, server-backed "daily warm-up before
 * coding" gate. Wraps the ENTIRE application router in App.jsx (not one
 * page), so that until today's quiz is completed:
 *   - no route renders (no Dashboard, Problems, Club, Profile, Analytics,
 *     or anything else),
 *   - the navbar / normal app shell is never mounted at all, since none of
 *     it lives above this component,
 *   - manually entering a URL, refreshing, or clearing browser storage
 *     cannot bypass the gate — every one of those still re-renders
 *     DailyQuizGuard first, which re-derives its answer from the server.
 *
 * This replaces the earlier, client-only "once per session" onboarding
 * quiz step (formerly OnboardingGate + OnboardingContainer's `quiz` step +
 * src/utils/dailyQuizStorage.js's day-key localStorage check). That
 * design explicitly did not persist to the server and only gated
 * /dashboard; this one is stricter on both counts, per the Daily Quiz
 * Gate spec. The Welcome/Mission/Focus/Readiness onboarding steps that
 * used to run alongside the old quiz step are not part of this gate —
 * they're left in place as standalone components (WelcomeScreen.jsx,
 * DailyMission.jsx, TodaysFocus.jsx, WorkspacePreparationScreen.jsx) for
 * possible reuse elsewhere, not wired into anything right now.
 *
 * `DailyQuickQuiz` itself (the actual 5-question UI) is reused as-is —
 * only what happens on completion changes: it now calls the backend
 * before unlocking instead of writing to localStorage.
 *
 * Role note: admins are exempted once role has resolved, same precedent
 * as ThemeGate exempting admin from the theme-selection gate — a daily
 * coding warm-up is a student-facing gamification concept that has no
 * bearing on the admin console.
 */
export default function DailyQuizGuard({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { role, isBackendReady } = useAppContext();

  // "loading" | "required" | "unlocked" | "error"
  const [status, setStatus] = useState("loading");
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState(null);
  const [retryToken, setRetryToken] = useState(0);

  const isAdmin = isBackendReady && role === "admin";

  useEffect(() => {
    // Wait for auth to resolve and for a real user before doing anything —
    // avoids flashing the quiz (or the app) before we actually know.
    if (authLoading || !user) return undefined;

    // Wait for role to hydrate (same race ThemeGate guards against) so the
    // admin exemption below doesn't fire on the "student" default for one
    // render before the real role comes back.
    if (!isBackendReady) return undefined;

    // Admin is exempt (see this file's header comment) — decided in render
    // below via `isAdmin`, not here, so there's no status fetch to skip.
    if (isAdmin) return undefined;

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
  }, [authLoading, user, isBackendReady, isAdmin, retryToken]);

  async function handleQuizComplete() {
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

  // Not authenticated (or Firebase still resolving): nothing to gate.
  // Public routes must keep working regardless of quiz state.
  if (authLoading || !user) {
    return children;
  }

  if (!isBackendReady) {
    return <FullScreenSpinner />;
  }

  if (isAdmin) {
    return children;
  }

  if (status === "loading") {
    return <FullScreenSpinner />;
  }

  if (status === "error") {
    return (
      <FullScreenMessage
        icon={<AlertTriangle size={28} className="text-verdict-reject" />}
        title="Couldn't load today's warm-up"
        description="We couldn't reach the server to check your daily quiz status. Please check your connection and try again."
      >
        <Button variant="primary" size="lg" onClick={() => setRetryToken((t) => t + 1)}>
          Retry
        </Button>
      </FullScreenMessage>
    );
  }

  if (status === "required") {
    return (
      <div className="min-h-screen bg-[var(--background)] px-4">
        <DailyQuickQuiz onComplete={handleQuizComplete} />
        {completeError && (
          <div className="max-w-xl mx-auto mt-4">
            <FullScreenMessage
              icon={<AlertTriangle size={20} className="text-verdict-reject" />}
              title="Couldn't save your result"
              description={completeError}
              compact
            >
              <Button
                variant="secondary"
                size="md"
                loading={completing}
                onClick={handleQuizComplete}
              >
                Retry
              </Button>
            </FullScreenMessage>
          </div>
        )}
      </div>
    );
  }

  // status === "unlocked"
  return children;
}

function FullScreenSpinner() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Sparkles size={24} className="text-[var(--theme-primary,#2dd4bf)] animate-pulse" />
        <div className="w-8 h-8 border-2 border-[var(--border-strong)] border-t-[var(--theme-primary,#2dd4bf)] rounded-full animate-spin" />
      </div>
    </div>
  );
}

function FullScreenMessage({ icon, title, description, children, compact = false }) {
  return (
    <div
      className={
        compact
          ? "border border-[var(--border)] rounded-2xl p-5 text-center bg-[var(--surface)]"
          : "min-h-screen bg-[var(--background)] flex items-center justify-center px-4"
      }
    >
      <div className={compact ? "" : "max-w-sm w-full text-center"}>
        <div className="flex justify-center mb-3">{icon}</div>
        <h2 className="text-[var(--foreground)] font-semibold mb-1">{title}</h2>
        <p className="text-[var(--muted-foreground)] text-sm mb-5">{description}</p>
        {children}
      </div>
    </div>
  );
}
