import { useAppContext } from "../../../hooks/useAppContext";
import { useTheme } from "../../../context/ThemeContext";

function RankProgressSection() {
  const { theme } = useTheme();

  const {
    solvedProblems,
    currentStreak,
  } = useAppContext();

  const level = solvedProblems.length;

  function getRank() {
    if (level < 5) return "Beginner";
    if (level < 15) return "Learner";
    if (level < 30) return "Intermediate";
    if (level < 60) return "Advanced";

    return "Expert";
  }

  const rank = getRank();

  const progress = (level % 10) * 10;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

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
          {10 - (level % 10)} {theme.words.nextMilestone}
        </p>

        <p className="text-orange-400">
          🔥 {currentStreak} Day Streak
        </p>

      </div>

    </div>
  );
}

export default RankProgressSection;