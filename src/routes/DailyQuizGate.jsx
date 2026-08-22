import { AlertTriangle, Sparkles } from "lucide-react";
import Button from "../components/ui/Button";
import DailyQuickQuiz from "../components/onboarding/DailyQuickQuiz";
import { useDailyQuizStatus } from "../hooks/useDailyQuizStatus";

/**
 * DailyQuizGate — renders in place of a protected page's content until
 * today's quiz is confirmed complete by the server. Used exclusively by
 * `ProtectedRoute` (see that file), which is itself the codebase's single
 * existing place every genuinely protected page already routes through —
 * so this doesn't introduce a second, parallel "does this page need
 * gating" list to keep in sync, and it can't accidentally cover a public
 * route ProtectedRoute doesn't wrap.
 *
 * Because this only ever renders instead of `children` (never alongside
 * it), and the page's own layout — including Navbar, which every
 * protected page mounts itself via DashboardLayout — lives inside
 * `children`, the navbar/app shell genuinely never mounts while gated:
 * there's nothing above this component to render it.
 *
 * Status itself comes from `DailyQuizProvider` (mounted once above the
 * router — see App.jsx) via `useDailyQuizStatus`, not fetched here, so
 * navigating between two already-unlocked protected pages doesn't
 * re-trigger a status check or a loading flash.
 *
 * `DailyQuickQuiz` (the actual 5-question UI) is reused as-is — only what
 * happens on completion differs: `completeQuiz` (from context) persists
 * to the server before unlocking.
 */
export default function DailyQuizGate({ children }) {
  const { status, isBackendReady, retry, completeQuiz, completing, completeError } =
    useDailyQuizStatus();

  if (!isBackendReady || status === "loading") {
    return <FullScreenSpinner />;
  }

  if (status === "error") {
    return (
      <FullScreenMessage
        icon={<AlertTriangle size={28} className="text-verdict-reject" />}
        title="Couldn't load today's warm-up"
        description="We couldn't reach the server to check your daily quiz status. Please check your connection and try again."
      >
        <Button variant="primary" size="lg" onClick={retry}>
          Retry
        </Button>
      </FullScreenMessage>
    );
  }

  if (status === "required") {
    return (
      <div className="min-h-screen bg-black px-4">
        <DailyQuickQuiz onComplete={completeQuiz} />
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
                onClick={completeQuiz}
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
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Sparkles size={24} className="text-[var(--theme-primary,#2dd4bf)] animate-pulse" />
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-[var(--theme-primary,#2dd4bf)] rounded-full animate-spin" />
      </div>
    </div>
  );
}

function FullScreenMessage({ icon, title, description, children, compact = false }) {
  return (
    <div
      className={
        compact
          ? "border border-zinc-800 rounded-2xl p-5 text-center bg-ink-900"
          : "min-h-screen bg-black flex items-center justify-center px-4"
      }
    >
      <div className={compact ? "" : "max-w-sm w-full text-center"}>
        <div className="flex justify-center mb-3">{icon}</div>
        <h2 className="text-white font-semibold mb-1">{title}</h2>
        <p className="text-zinc-500 text-sm mb-5">{description}</p>
        {children}
      </div>
    </div>
  );
}
