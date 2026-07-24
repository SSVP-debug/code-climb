import { Check } from "lucide-react";
import { useHideDifficultyLabels } from "../../hooks/useHideDifficultyLabels";

// Static lookup — Tailwind's JIT scanner needs literal class strings in
// source, so this can't be built with a template literal like
// `bg-${color}-500` (that string would never appear anywhere for Tailwind
// to find, and the classes would silently not exist in the shipped CSS).
const COLOR_CLASSES = {
  green:   { border: "border-green-500/30",   bg: "bg-green-500/10",   text: "text-green-400",   bar: "bg-green-500" },
  blue:    { border: "border-blue-500/30",    bg: "bg-blue-500/10",    text: "text-blue-400",    bar: "bg-blue-500" },
  cyan:    { border: "border-cyan-500/30",    bg: "bg-cyan-500/10",    text: "text-cyan-400",    bar: "bg-cyan-500" },
  purple:  { border: "border-purple-500/30",  bg: "bg-purple-500/10",  text: "text-purple-400",  bar: "bg-purple-500" },
  orange:  { border: "border-orange-500/30",  bg: "bg-orange-500/10",  text: "text-orange-400",  bar: "bg-orange-500" },
  red:     { border: "border-red-500/30",     bg: "bg-red-500/10",     text: "text-red-400",     bar: "bg-red-500" },
  emerald: { border: "border-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-400", bar: "bg-emerald-500" },
  lime:    { border: "border-lime-500/30",    bg: "bg-lime-500/10",    text: "text-lime-400",    bar: "bg-lime-500" },
  pink:    { border: "border-pink-500/30",    bg: "bg-pink-500/10",    text: "text-pink-400",    bar: "bg-pink-500" },
  yellow:  { border: "border-yellow-500/30",  bg: "bg-yellow-500/10",  text: "text-yellow-400",  bar: "bg-yellow-500" },
};

const DIFFICULTY_BADGE = {
  Beginner:     "bg-green-500/10 text-green-400 border-green-500/30",
  Intermediate: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  Advanced:     "bg-red-500/10 text-red-400 border-red-500/30",
};

function PatternCard({ pattern, solved, total, onClick }) {
  const hideDifficulty = useHideDifficultyLabels();
  const colors = COLOR_CLASSES[pattern.color] || COLOR_CLASSES.green;
  const percent = total > 0 ? Math.round((solved / total) * 100) : 0;
  const complete = total > 0 && solved >= total;

  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl border ${colors.border} ${colors.bg} p-5 hover:brightness-125 transition group relative overflow-hidden`}
    >
      {complete && (
        <span className="absolute top-3 right-3 text-xs font-semibold text-verdict-accept flex items-center gap-1">
          <Check size={13} strokeWidth={3} aria-hidden="true" /> Mastered
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <span className="text-3xl">{pattern.icon}</span>
        {!hideDifficulty && (
          <span
            className={`text-[10px] font-semibold uppercase tracking-wide rounded-full border px-2 py-0.5 ${DIFFICULTY_BADGE[pattern.difficulty] || DIFFICULTY_BADGE.Beginner}`}
          >
            {pattern.difficulty}
          </span>
        )}
      </div>

      <h3 className="mt-3 font-semibold text-white group-hover:underline">
        {pattern.name}
      </h3>
      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
        {pattern.description}
      </p>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1.5">
          <span>{solved}/{total} solved</span>
          <span>~{pattern.estimatedHours}h</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full ${colors.bar} transition-all`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </button>
  );
}

export default PatternCard;