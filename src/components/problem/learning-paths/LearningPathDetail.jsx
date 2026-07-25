import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Clock, ListTodo } from "lucide-react";
import { useAuth } from "../../../context/authContext";
import { useHideDifficultyLabels } from "../../../hooks/useHideDifficultyLabels";
import { computeProblemStatuses, STATUS } from "../../../utils/learningPathProgress";
import { LEARNING_PATH_ICONS, LEARNING_PATH_COLOR_CLASSES } from "./learningPathIcons";
import LearningPathProblemItem from "./LearningPathProblemItem";
import LearningPathCompletionModal from "./LearningPathCompletionModal";

const DIFFICULTY_BADGE = {
  Beginner: "bg-teal-500/10 text-teal-400 border-teal-500/30",
  Intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  Advanced: "bg-rose-500/10 text-rose-400 border-rose-500/30",
};

function formatEstimatedTime({ low, high, unit }) {
  return `${low}–${high} ${unit}`;
}

function celebrationSeenKey(uid, pathId) {
  return `cc_seenPathCelebration:${uid || "anon"}:${pathId}`;
}

function hasSeenCelebration(uid, pathId) {
  try {
    return localStorage.getItem(celebrationSeenKey(uid, pathId)) === "true";
  } catch {
    return false;
  }
}

function markCelebrationSeen(uid, pathId) {
  try {
    localStorage.setItem(celebrationSeenKey(uid, pathId), "true");
  } catch {
    /* best-effort only — this flag is display-only, never read to
       compute progress or XP, see plans/001-learning-paths.md §5 file 8 */
  }
}

// Detail view for a single opened Learning Path. Props:
//   path                   — one enriched entry from useLearningPaths()
//   solvedProblems         — the global solved-slugs array from useAppContext
//   isFirstPathToComplete  — whether no OTHER path is already complete
//                            (used only for the completion modal's copy)
//   onBack()               — return to the path list
function LearningPathDetail({ path, solvedProblems, isFirstPathToComplete, onBack }) {
  const { user } = useAuth();
  const hideDifficulty = useHideDifficultyLabels();
  const colors = LEARNING_PATH_COLOR_CLASSES[path.color] || LEARNING_PATH_COLOR_CLASSES.teal;
  const Icon = LEARNING_PATH_ICONS[path.icon];
  const { solvedCount, total, percent, isComplete } = path.progress;

  const statuses = computeProblemStatuses(path.problems, solvedProblems);
  const statusBySlug = new Map(statuses.map((s) => [s.slug, s.status]));

  // Trigger-once rule: only show the celebration on the incomplete →
  // complete transition, not on every visit to an already-complete path
  // (e.g. a returning power user who had already solved every problem in
  // this path before ever opening it). A previous-value ref, not just
  // `isComplete`, is what makes this distinction — see edge case §8.6 in
  // plans/001-learning-paths.md.
  const wasCompleteRef = useRef(isComplete);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const justCompleted = isComplete && !wasCompleteRef.current;
    wasCompleteRef.current = isComplete;

    if (justCompleted && !hasSeenCelebration(user?.uid, path.id)) {
      setShowCelebration(true);
      markCelebrationSeen(user?.uid, path.id);
    }
  }, [isComplete, path.id, user?.uid]);

  // Row #1 can never actually be locked (it's always solved or current —
  // see LearningPathProblemItem's unlock-hint logic), so this lookup only
  // ever matters for row 2+, but is computed generically rather than
  // special-cased.
  function previousProblemTitle(index) {
    return path.problems[index - 1]?.title;
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition w-fit"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to Learning Paths
      </button>

      {/* Hero */}
      <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-6`}>
        <div className="flex items-start justify-between gap-3">
          <span className={`p-3 rounded-xl ${colors.bg} ${colors.text}`}>
            {Icon && <Icon size={28} strokeWidth={2} aria-hidden="true" />}
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

        <h2 className="mt-3 text-xl font-bold text-white">{path.name}</h2>
        <p className="text-sm text-zinc-400 mt-1">{path.tagline}</p>

        <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <ListTodo size={13} aria-hidden="true" /> {total} problems
          </span>
          <span className="flex items-center gap-1">
            <Clock size={13} aria-hidden="true" /> {formatEstimatedTime(path.estimatedTime)}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span>{solvedCount}/{total} solved</span>
            <span>{percent}% complete</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${colors.bar} transition-all`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Problem list */}
      {total === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-10">
          This path doesn't have any problems yet — check back soon.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {path.problems.map((problem, index) => (
            <LearningPathProblemItem
              key={problem.slug}
              problem={problem}
              order={index + 1}
              status={statusBySlug.get(problem.slug) ?? STATUS.LOCKED}
              unlockHintTitle={previousProblemTitle(index)}
              pathId={path.id}
            />
          ))}
        </div>
      )}

      {showCelebration && (
        <LearningPathCompletionModal
          path={path}
          isFirstPathCompleted={isFirstPathToComplete}
          onDismiss={() => setShowCelebration(false)}
        />
      )}
    </div>
  );
}

export default LearningPathDetail;