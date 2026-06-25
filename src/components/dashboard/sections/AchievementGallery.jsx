import { ACHIEVEMENTS } from "../../../data/achievements";
import { useTheme } from "../../../context/ThemeContext";
import { useAppContext } from "../../../hooks/useAppContext";
import SectionCard from "../../ui/layout/SectionCard";
import EmptyState from "../../ui/feedback/EmptyState";

function AchievementGallery() {
  const { theme } = useTheme();

  const {
    achievements,
  } = useAppContext();

  const unlocked = new Set(
    achievements.map((a) => a.key)
  );

  return (
    <SectionCard title={theme.words.achievements}>



      {achievements.length === 0 ? (
        <EmptyState
          message={theme.words.noAchievements}
          compact
        />
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
    </SectionCard>
  );
}

export default AchievementGallery;