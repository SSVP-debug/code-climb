import { useState } from "react";
import { saveReflection } from "../../../services/reflectionService";

// Order matters — rendered left to right, easy → hardest.
const OPTIONS = [
  { value: "easy", emoji: "😀", label: "Easy" },
  { value: "manageable", emoji: "🙂", label: "Manageable" },
  { value: "challenging", emoji: "😓", label: "Challenging" },
  { value: "reallyDifficult", emoji: "😵", label: "Really Difficult" },
];

/**
 * ReflectionPrompt — Feature 3 of the Submission Experience.
 *
 * "How difficult did this problem feel?" — one click, optional, never
 * blocks anything. Only UI + storage today (per spec); no analytics read
 * this yet, so the only job here is: pick → save → show a quiet confirmation.
 *
 * `submissionId` ties the rating to the exact submission being celebrated
 * (a resubmitted Accepted attempt on the same problem gets its own prompt
 * and its own rating — see backend/models/Reflection.js).
 */
function ReflectionPrompt({ submissionId }) {
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSelect = async (value) => {
    if (selected || saving || !submissionId) return;
    setSelected(value);
    setSaving(true);
    try {
      await saveReflection(submissionId, value);
    } catch (err) {
      // Never blocks the user, and there's nothing actionable for them to
      // do about a failed background save — just log it and leave the
      // "thanks" state showing (a silent retry isn't worth the complexity
      // for a one-click, non-critical rating).
      console.error("[ReflectionPrompt] Failed to save reflection:", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-1">
      <p className="text-xs font-medium text-zinc-400 mb-2 text-center">
        How difficult did this problem feel?
      </p>

      {selected ? (
        <p className="text-center text-xs text-[var(--theme-primary,#2dd4bf)] py-1.5 animate-[fadeIn_.2s_ease-out]">
          Thanks for the feedback!
        </p>
      ) : (
        <div className="flex items-center justify-center gap-2">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              disabled={!submissionId}
              title={opt.label}
              aria-label={opt.label}
              className="group flex flex-col items-center gap-1 rounded-xl px-2.5 py-2 border border-transparent hover:border-zinc-700 hover:bg-zinc-800/60 active:scale-95 transition disabled:opacity-40 disabled:pointer-events-none"
            >
              <span className="text-xl leading-none group-hover:scale-110 transition-transform">
                {opt.emoji}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReflectionPrompt;
