import { Link } from "react-router-dom";
import { ACHIEVEMENT_METADATA } from "../../../config/achievementMetadata";
import { useTheme } from "../../../context/ThemeContext";
import { useAppContext } from "../../../hooks/useAppContext";
import SectionCard from "../../ui/layout/SectionCard";
import EmptyState from "../../ui/feedback/EmptyState";
import { Trophy } from "lucide-react";

function RecentAchievementCard() {
  const { theme } = useTheme();
  const { achievements } = useAppContext();

  if (achievements.length === 0) {
    return (
      <SectionCard
        title="Recent Achievement"
        subtitle="Keep solving to unlock badges."
        icon={<Trophy size={18} strokeWidth={2} />}
        accented
      >
        <EmptyState
          icon={theme.words.achievementIcon}
          title={theme.words.noAchievements}
          description="Keep solving to unlock your first badge."
          compact
        />
      </SectionCard>
    );
  }

  const latest = achievements[achievements.length - 1];

  const achievement = ACHIEVEMENT_METADATA[latest.key];

  if (!achievement) return null;

  return (
    <SectionCard
      title="Recent Achievement"
      subtitle="Unlocked recently"
      icon={<Trophy size={18} strokeWidth={2} />}
      accented
      action={
        <Link
          to="/profile"
          className="text-sm hover:brightness-110 transition"
          style={{ color: theme.colors.primary }}
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