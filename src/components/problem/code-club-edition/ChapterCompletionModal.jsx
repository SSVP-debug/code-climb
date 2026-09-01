import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { CHAPTER_ICONS, DEFAULT_CHAPTER_ICON } from "./codeClubEditionTheme";

// Modeled directly on LearningPathCompletionModal.jsx (same confetti call
// shape, same "click outside to dismiss" pattern) with brand teal kept as
// the celebratory color regardless of the chapter's own accent — the
// celebration itself is a platform moment, not a per-chapter one.
//
// "Prepare architecture for future rewards, achievements, and
// collectibles. Do not implement them yet." — the badge pill below is a
// static visual only, same intentional stub as Learning Paths' equivalent.
// A real implementation would POST to an achievements endpoint here and
// render the server-confirmed badge, not assume completion = award.
function ChapterCompletionModal({ chapter, nextChapter, onDismiss }) {
  const firedRef = useRef(false);
  const Icon = CHAPTER_ICONS[chapter.icon] || DEFAULT_CHAPTER_ICON;

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    confetti({
      particleCount: 140,
      spread: 90,
      origin: { y: 0.55 },
      colors: ["#2dd4bf", "#0d9488", "#a78bfa", "#facc15"],
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onDismiss?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40"
      aria-live="polite"
      role="dialog"
      aria-modal="true"
      onClick={onDismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--surface)] border border-teal-500/30 rounded-3xl p-8 text-center shadow-2xl shadow-teal-900/40 max-w-sm w-full mx-4"
        style={{ animation: "chapterCompletePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <div className="relative w-24 h-24 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping" />
          <div className="relative w-24 h-24 rounded-full bg-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/30">
            <Icon size={36} strokeWidth={2} className="text-black" aria-hidden="true" />
          </div>
        </div>

        <p className="text-xs text-teal-400 uppercase tracking-[0.2em] font-semibold mb-1">
          Chapter Complete
        </p>
        <h2 className="text-xl font-black text-[var(--foreground)] mb-2">
          {chapter.title} has been solved.
        </h2>

        {nextChapter ? (
          <p className="text-[var(--muted-foreground)] text-sm">
            You've unlocked{" "}
            <span className="text-[var(--foreground)] font-semibold">{nextChapter.title}</span>.
          </p>
        ) : (
          <p className="text-[var(--muted-foreground)] text-sm">
            You've cleared every chapter released so far — more are on the way.
          </p>
        )}

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-300">
          <Icon size={14} aria-hidden="true" />
          {chapter.title} Badge
        </div>

        <p className="mt-4 text-[10px] text-[var(--muted-foreground)]">
          Press Escape or click outside to dismiss
        </p>
      </div>
      <style>{`@keyframes chapterCompletePop { from{opacity:0;transform:scale(0.6) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }`}</style>
    </div>
  );
}

export default ChapterCompletionModal;