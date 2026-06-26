import { Link } from "react-router-dom";
import { ACHIEVEMENTS } from "../../../data/achievements";
import { useTheme } from "../../../context/ThemeContext";
import { useAppContext } from "../../../hooks/useAppContext";
import SectionCard from "../../ui/layout/SectionCard";
import EmptyState from "../../ui/feedback/EmptyState";

function RecentAchievementCard() {
  const { theme } = useTheme();
  const { achievements } = useAppContext();

  if (achievements.length === 0) {
    return (
      <SectionCard
        title="🏆 Recent Achievement"
        subtitle="Keep solving to unlock badges."
      >
        <EmptyState
          message={theme.words.noAchievements}
          compact
        />
      </SectionCard>
    );
  }

  const latest = achievements[achievements.length - 1];

  const achievement = ACHIEVEMENTS.find(
    (a) => a.key === latest.key
  );

  if (!achievement) return null;

  return (
    <SectionCard
      title="🏆 Recent Achievement"
      subtitle="Unlocked recently"
      action={
        <Link
          to="/profile"
          className="text-green-400 hover:text-green-300 text-sm"
        >
          View All →
        </Link>
      }
    >
      <div className="rounded-xl bg-zinc-800 p-5">
        <div className="flex items-center gap-4">
          <div className="text-4xl">
            {achievement.icon}
          </div>

          <div>
            <h3 className="text-xl font-bold">
              {achievement.title}
            </h3>

            <p className="text-zinc-400 mt-1">
              {achievement.description}
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export default RecentAchievementCard;