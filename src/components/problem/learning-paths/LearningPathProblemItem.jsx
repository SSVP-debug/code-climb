import { Link } from "react-router-dom";
import { useHideDifficultyLabels } from "../../../hooks/useHideDifficultyLabels";
import { STATUS_ICONS } from "./learningPathIcons";
import { STATUS } from "../../../utils/learningPathProgress";

// Matches ProblemCard.jsx's inline Easy/Medium/Hard badge colors — this is
// the existing, unrelated-to-brand-color convention for a problem's own
// difficulty, not something this feature should reinvent.
const DIFFICULTY_BADGE = {
  Easy: "bg-green-500/15 text-green-400 border-green-500/20",
  Medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  Hard: "bg-red-500/15 text-red-400 border-red-500/20",
};

const STATUS_STYLES = {
  [STATUS.SOLVED]: "text-verdict-accept",
  [STATUS.CURRENT]: "text-teal-400",
  [STATUS.LOCKED]: "text-zinc-600",
};

function LearningPathProblemItem({ problem, order, status, unlockHintTitle }) {
  const hideDifficulty = useHideDifficultyLabels();
  const StatusIcon = STATUS_ICONS[status];
  const locked = status === STATUS.LOCKED;

  const content = (
    <>
      <span className="flex-shrink-0 w-6 text-center text-xs font-semibold text-zinc-600">
        {order}
      </span>

      <span className={`flex-shrink-0 ${STATUS_STYLES[status]}`}>
        <StatusIcon size={18} strokeWidth={2} aria-hidden="true" />
      </span>

      <span
        className={`flex-1 min-w-0 truncate text-sm font-medium ${
          locked ? "text-zinc-600" : "text-zinc-100"
        }`}
      >
        {problem.title}
      </span>

      {!hideDifficulty && (
        <span
          className={`flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide rounded-full border px-2 py-0.5 ${
            DIFFICULTY_BADGE[problem.difficulty] || DIFFICULTY_BADGE.Easy
          } ${locked ? "opacity-40" : ""}`}
        >
          {problem.difficulty}
        </span>
      )}

      {/* XP reward — future-ready UI only, not real XP. No award logic
          lives here; XP is always computed server-side (see
          plans/001-learning-paths.md §7). */}
      <span
        className={`flex-shrink-0 text-[10px] font-semibold rounded-full border border-zinc-700 px-2 py-0.5 text-zinc-500 ${
          locked ? "opacity-40" : ""
        }`}
      >
        +50 XP
      </span>
    </>
  );

  const rowClasses =
    "group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all";

  if (locked) {
    return (
      <div
        className={`${rowClasses} border-zinc-800 bg-zinc-900/40 opacity-60 cursor-not-allowed`}
        aria-disabled="true"
        title={
          unlockHintTitle
            ? `Solve "${unlockHintTitle}" to unlock`
            : undefined
        }
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      to={`/problems/${problem.slug}`}
      className={`${rowClasses} ${
        status === STATUS.CURRENT
          ? "border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/10"
          : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900"
      }`}
    >
      {content}
    </Link>
  );
}

export default LearningPathProblemItem;
