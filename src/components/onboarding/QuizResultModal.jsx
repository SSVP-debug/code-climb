import { useEffect } from "react";
import { X } from "lucide-react";
import QuizResultSummary from "./QuizResultSummary";

/**
 * QuizResultModal — lets a person reopen today's Daily Quick Quiz result
 * after they've already continued past it once. Currently unused/orphaned
 * (no caller passes it a `result` today — see DailyQuizGate.jsx, which
 * replaced the old onboarding quiz step and doesn't keep the result around
 * after completion). Expects the same in-memory result shape
 * scoreQuizAttempt produces.
 *
 * Closable via the X button, clicking the backdrop, or Escape — same
 * pattern as LevelUpModal (src/components/gamification/LevelUpModal.jsx).
 */
export default function QuizResultModal({ result, onClose }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Today's Daily Quick Quiz results"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
        >
          <X size={20} />
        </button>

        <QuizResultSummary result={result} />
      </div>
    </div>
  );
}