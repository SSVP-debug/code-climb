import { Check, Clock, ListTodo } from "lucide-react";
import { useHideDifficultyLabels } from "../../../hooks/useHideDifficultyLabels";
import { LEARNING_PATH_ICONS, LEARNING_PATH_COLOR_CLASSES } from "./learningPathIcons";

const DIFFICULTY_BADGE = {
  Beginner: "bg-teal-500/10 text-teal-400 border-teal-500/30",
  Intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  Advanced: "bg-rose-500/10 text-rose-400 border-rose-500/30",
};

function formatEstimatedTime({ low, high, unit }) {
  return `${low}–${high} ${unit}`;
}

function LearningPathCard({ path, onOpen }) {
  const hideDifficulty = useHideDifficultyLabels();
  const colors = LEARNING_PATH_COLOR_CLASSES[path.color] || LEARNING_PATH_COLOR_CLASSES.teal;
  const Icon = LEARNING_PATH_ICONS[path.icon];
  const { solvedCount, total, percent, isComplete, isStarted } = path.progress;

  return (
    <button
      onClick={() => onOpen(path.id)}
      className={`text-left rounded-2xl border ${colors.border} ${colors.bg} p-5 hover:brightness-125 transition group relative overflow-hidden flex flex-col`}
    >
      {isComplete && (
        <span className="absolute top-3 right-3 text-xs font-semibold text-verdict-accept flex items-center gap-1">
          <Check size={13} strokeWidth={3} aria-hidden="true" /> Mastered
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <span className={`p-2.5 rounded-xl ${colors.bg} ${colors.text}`}>
          {Icon && <Icon size={22} strokeWidth={2} aria-hidden="true" />}
        </span>
        {!hideDifficulty && (
          <span
            className={`text-[10px] font-semibold uppercase tracking-wide rounded-full border px-2 py-0.5 ${
              DIFFICULTY_BADGE[path.difficulty] || DIFFICULTY_BADGE.Beginner
            }`}
          >
            {path.difficulty}
          </span>
        )}
      </div>

      <h3 className="mt-3 font-semibold text-white group-hover:underline">
        {path.name}
      </h3>
      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{path.tagline}</p>

      <div className="mt-3 flex items-center gap-3 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1">
          <ListTodo size={12} aria-hidden="true" /> {total} problems
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} aria-hidden="true" /> {formatEstimatedTime(path.estimatedTime)}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1.5">
          <span>{solvedCount}/{total} solved</span>
          <span>{percent}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full ${colors.bar} transition-all`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="mt-4">
        <span
          className={`inline-flex items-center justify-center w-full rounded-xl py-2 text-sm font-semibold transition ${colors.bg} ${colors.text} border ${colors.border} group-hover:brightness-125`}
        >
          {isStarted ? "Continue" : "Start Learning"}
        </span>
      </div>
    </button>
  );
}

export default LearningPathCard;
