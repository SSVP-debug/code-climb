import { useAppContext } from "../../../hooks/useAppContext";
import { useTheme } from "../../../context/ThemeContext";
import SectionCard from "../../ui/layout/SectionCard";
import {
  getLevel,
  getLevelProgress,
  getXPForNextLevel,
} from "../../../utils/levelUtils";
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

  function getRank() {
    if (level < 3) return "Beginner";
    if (level < 5) return "Learner";
    if (level < 10) return "Intermediate";
    if (level < 20) return "Advanced";

    return "Expert";
  }

  const rank = getRank();


  return (
    <SectionCard>

      <div className="flex items-center justify-between mb-6">

        <div>
          <p className="text-zinc-400 text-sm">
            {theme.words.rank}
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {rank}
          </h2>
        </div>

        <div className="text-right">
          <p className="text-zinc-400 text-sm">
            {theme.words.level}
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {level}
          </h2>

          <p className="text-zinc-400 text-sm mt-1">
            {totalXP} XP
          </p>
        </div>

      </div>

      <div className="w-full bg-zinc-800 rounded-full h-4 overflow-hidden">
        <div
          className="bg-green-500 h-full transition-all duration-500"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <div className="flex justify-between mt-3 text-sm">

        <p className="text-zinc-400">
          {xpRemaining} XP until Level {level + 1}
        </p>

        <p className="text-orange-400">
          🔥 {currentStreak} Day Streak
        </p>

      </div>

    </SectionCard>
  );
}

export default RankProgressSection;