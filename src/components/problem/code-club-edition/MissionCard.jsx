import { Link } from "react-router-dom";
import { useHideDifficultyLabels } from "../../../hooks/useHideDifficultyLabels";
import { getEarnedXP } from "../../../utils/xpUtils";
import { MISSION_STATUS_ICONS } from "./codeClubEditionTheme";
import { STATUS } from "../../../utils/codeClubEditionProgress";

// Matches ProblemCard.jsx / LearningPathProblemItem.jsx's inline
// Easy/Medium/Hard badge colors — the existing, unrelated-to-brand-color
// convention for a problem's own difficulty.
const PROBLEM_DIFFICULTY_BADGE = {
  Easy: "bg-green-500/15 text-green-400 border-green-500/20",
  Medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  Hard: "bg-red-500/15 text-red-400 border-red-500/20",
};

const STATUS_TEXT_COLOR = {
  [STATUS.SOLVED]: "text-verdict-accept",
  [STATUS.CURRENT]: "text-teal-400",
  [STATUS.LOCKED]: "text-zinc-600",
};

function MissionCard({ mission, status, order, unlockHintTitle, chapterId }) {
  const hideDifficulty = useHideDifficultyLabels();
  const StatusIcon = MISSION_STATUS_ICONS[status];
  const locked = status === STATUS.LOCKED;
  const xp = getEarnedXP(mission.difficulty);

  const inner = (
    <>
      <div className="flex items-start gap-3">
        <span className={`flex-shrink-0 mt-0.5 ${STATUS_TEXT_COLOR[status]}`}>
          <StatusIcon size={20} strokeWidth={2} aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Mission {order}
            </span>
            {!hideDifficulty && (
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide rounded-full border px-1.5 py-0.5 ${
                  PROBLEM_DIFFICULTY_BADGE[mission.difficulty] || PROBLEM_DIFFICULTY_BADGE.Easy
                } ${locked ? "opacity-40" : ""}`}
              >
                {mission.difficulty}
              </span>
            )}
          </div>

          <h4 className={`mt-0.5 font-semibold ${locked ? "text-zinc-600" : "text-white"}`}>
            {mission.missionTitle}
          </h4>

          {!locked && mission.storyIntro && (
            <p className="text-xs text-zinc-400 mt-1 italic leading-relaxed">
              "{mission.storyIntro}"
            </p>
          )}
        </div>

        <span
          className={`flex-shrink-0 text-[10px] font-semibold rounded-full border border-zinc-700 px-2 py-1 text-zinc-500 ${
            locked ? "opacity-40" : ""
          }`}
        >
          +{xp} XP
        </span>
      </div>
    </>
  );

  const rowClasses =
    "block rounded-2xl border px-4 py-3.5 transition-all";

  if (locked) {
    return (
      <div
        className={`${rowClasses} border-zinc-800 bg-zinc-900/40 opacity-60 cursor-not-allowed`}
        aria-disabled="true"
        title={unlockHintTitle ? `Solve "${unlockHintTitle}" to unlock` : undefined}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      to={`/problems/${mission.slug}?edition=${chapterId}`}
      className={`${rowClasses} group ${
        status === STATUS.CURRENT
          ? "border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/10"
          : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900"
      }`}
    >
      {inner}
    </Link>
  );
}

export default MissionCard;