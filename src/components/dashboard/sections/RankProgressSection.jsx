import { useAppContext } from "../../../hooks/useAppContext";
import { useTheme } from "../../../context/ThemeContext";
import SectionCard from "../../ui/layout/SectionCard";
import {
  getLevel,
  getLevelProgress,
  getXPForNextLevel,
} from "../../../utils/levelUtils";
import StreakBadge from "../../common/StreakBadge";
function RankProgressSection() {
  const { theme } = useTheme();

  const {
    totalXP,
    currentStreak,
  } = useAppContext();



  const level = getLevel(totalXP);

  const progress =
    getLevelProgress(totalXP);

  const xpRemaining =
    getXPForNextLevel(totalXP);

  const RANKS = [
    "Beginner",
    "Learner",
    "Intermediate",
    "Advanced",
    "Expert",
  ];

  const rank =
    level < 3
      ? RANKS[0]
      : level < 5
        ? RANKS[1]
        : level < 10
          ? RANKS[2]
          : level < 20
            ? RANKS[3]
            : RANKS[4];




  return (
    <SectionCard>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">

        <div className="min-w-0">
          <p className="text-zinc-400 text-sm">
            {theme.words.rank}
          </p>

          <h2 className="text-2xl sm:text-3xl font-bold mt-2 break-words">
            {rank}
          </h2>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-zinc-400 text-sm">
            {theme.words.level}
          </p>

          <h2 className="text-2xl sm:text-3xl font-bold mt-2">
            {level}
          </h2>

          <p className="text-zinc-400 text-sm mt-1">
            {totalXP} XP
          </p>
          <p className="text-xs text-green-400 mt-1">
            {progress.toFixed(0)}% to Level {level + 1}
          </p>
        </div>

      </div>

      <div className="w-full bg-zinc-800 rounded-full h-4 overflow-hidden">
        <div
          className="bg-green-500 h-full rounded-full transition-all duration-700"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <p className="text-xs text-zinc-500 mt-2">
        Keep solving problems to reach the next level.
      </p>

      <div className="flex justify-between flex-wrap gap-2 mt-3 text-sm">

        <p className="text-zinc-400">
          {xpRemaining} XP to Level {level + 1}
        </p>

        <StreakBadge
          streak={currentStreak}
          size="sm"
        />

      </div>

    </SectionCard>
  );
}

export default RankProgressSection;