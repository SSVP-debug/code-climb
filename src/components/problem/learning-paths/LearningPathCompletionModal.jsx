import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { LEARNING_PATH_ICONS } from "./learningPathIcons";

// Celebration modal for finishing a Learning Path. Modeled directly on
// src/components/gamification/LevelUpModal.jsx (same confetti call shape,
// same "click outside to dismiss" pattern) — teal instead of green per
// this feature's color decision, see learningPathIcons.js.
function LearningPathCompletionModal({ path, isFirstPathCompleted, onDismiss }) {
  const firedRef = useRef(false);
  const Icon = LEARNING_PATH_ICONS[path.icon];

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.55 },
      colors: ["#2dd4bf", "#0d9488", "#facc15", "#a855f7"],
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
        className="bg-zinc-900 border border-teal-500/30 rounded-3xl p-8 text-center shadow-2xl shadow-teal-900/40 max-w-xs w-full mx-4"
        style={{ animation: "learningPathCompletePop 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <div className="relative w-24 h-24 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping" />
          <div className="relative w-24 h-24 rounded-full bg-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/30">
            {Icon && <Icon size={36} strokeWidth={2} className="text-black" aria-hidden="true" />}
          </div>
        </div>

        <p className="text-xs text-teal-400 uppercase tracking-[0.2em] font-semibold mb-1">
          Path Complete
        </p>
        <h2 className="text-xl font-black text-white mb-2">
          {path.name} Bundle Complete!
        </h2>
        <p className="text-zinc-400 text-sm">
          {isFirstPathCompleted
            ? "You've completed your first learning path."
            : "You've completed this learning path."}
        </p>

        {/* Extension point for a future Achievements system: this is
            currently a static visual only. A real implementation would
            POST to an achievements endpoint here and render the
            server-confirmed badge, not assume completion = award. */}
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-300">
          {Icon && <Icon size={14} aria-hidden="true" />}
          {path.name} Badge
        </div>

        <p className="mt-4 text-[10px] text-zinc-600">
          Press Escape or click outside to dismiss
        </p>
      </div>
      <style>{`@keyframes learningPathCompletePop { from{opacity:0;transform:scale(0.6) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }`}</style>
    </div>
  );
}

export default LearningPathCompletionModal;