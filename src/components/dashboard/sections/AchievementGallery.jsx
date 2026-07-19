import { ACHIEVEMENTS_LIST } from "../../../config/achievementMetadata";
import { useTheme } from "../../../context/ThemeContext";
import { useAppContext } from "../../../hooks/useAppContext";
import SectionCard from "../../ui/layout/SectionCard";
import EmptyState from "../../ui/feedback/EmptyState";
import { Trophy, CheckCircle2, Lock } from "lucide-react";

function AchievementGallery() {
  const { theme } = useTheme();

  const {
    achievements,
  } = useAppContext();

  const unlocked = new Set(
    achievements.map((a) => a.key)
  );

  return (
    <SectionCard title={theme.words.achievements} icon={<Trophy size={18} strokeWidth={2} />} accented>



      {achievements.length === 0 ? (
        <EmptyState
          icon={theme.words.achievementIcon}
          title={theme.words.noAchievements}
          description="Keep solving to unlock your first badge."
          compact
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {ACHIEVEMENTS_LIST.map((achievement) => {
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

                <p className="mt-2 text-xs flex items-center gap-1.5">
                  {isUnlocked ? (
                    <>
                      <CheckCircle2 size={12} strokeWidth={2.5} className="text-green-400" aria-hidden="true" />
                      Unlocked
                    </>
                  ) : (
                    <>
                      <Lock size={12} strokeWidth={2.5} className="text-zinc-500" aria-hidden="true" />
                      Locked
                    </>
                  )}
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