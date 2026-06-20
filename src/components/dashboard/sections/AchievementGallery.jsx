import { useMemo } from "react";
import { ACHIEVEMENTS } from "../../../data/achievements";
import { useTheme } from "../../../context/ThemeContext";
import { useAppContext } from "../../../hooks/useAppContext";

function AchievementGallery() {
  const { theme } = useTheme();

  const {
    achievements,
  } = useAppContext();

  const unlocked = new Set(
    achievements.map((a) => a.key)
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

      <h2 className="text-2xl font-semibold mb-6">
        {theme.words.achievements}
      </h2>

      {achievements.length === 0 ? (
        <p className="text-zinc-400">
          {theme.words.noAchievements}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {ACHIEVEMENTS.map((achievement) => {
            const isUnlocked =
              unlocked.has(achievement.key);

            return (
              <div
                key={achievement.key}
                className={`rounded-xl p-4 ${isUnlocked
                    ? "bg-zinc-800"
                    : "bg-zinc-900 opacity-50"
                  }`}
              >
                <h3 className="text-lg font-bold">
                  {achievement.icon}{" "}
                  {achievement.title}
                </h3>

                <p className="text-zinc-400 text-sm mt-2">
                  {achievement.description}
                </p>

                <p className="mt-2 text-xs">
                  {isUnlocked
                    ? "✅ Unlocked"
                    : "🔒 Locked"}
                </p>
              </div>
            );
          })}

        </div>
      )}
    </div>
  );
}

export default AchievementGallery;