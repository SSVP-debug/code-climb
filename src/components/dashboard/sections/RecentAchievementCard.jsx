import { Link } from "react-router-dom";
import { ACHIEVEMENT_METADATA } from "../../../config/achievementMetadata";
import { ACHIEVEMENT_ICONS, DEFAULT_ACHIEVEMENT_ICON } from "../../../config/achievementIcons";
import { useTheme } from "../../../hooks/useTheme";
import { useAppContext } from "../../../hooks/useAppContext";
import SectionCard from "../../ui/layout/SectionCard";
import EmptyState from "../../ui/feedback/EmptyState";
import { Trophy } from "lucide-react";

function RecentAchievementCard() {
  const { theme } = useTheme();
  const { achievements } = useAppContext();

  const AchievementIcon = theme.words.achievementIcon || Trophy;

  if (achievements.length === 0) {
    return (
      <SectionCard
        title="Recent Achievement"
        subtitle="Keep solving to unlock badges."
        icon={<Trophy size={18} strokeWidth={2} />}
        accented
      >
        <EmptyState
          icon={<AchievementIcon size={28} strokeWidth={1.75} />}
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

  const Icon = ACHIEVEMENT_ICONS[latest.key] || DEFAULT_ACHIEVEMENT_ICON;

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
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 shrink-0">
            <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
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