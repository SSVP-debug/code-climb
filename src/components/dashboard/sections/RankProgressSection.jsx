import { useAppContext } from "../../../hooks/useAppContext";
import { useTheme } from "../../../hooks/useTheme";
import SectionCard from "../../ui/layout/SectionCard";
import { getLevel, getLevelProgress } from "../../../utils/xpLevel";
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

  // Audit fix: previously sourced from levelUtils.js's flat xp/100 formula
  // via a separate getXPForNextLevel() — that formula disagreed with the
  // curve-based one Profile.jsx/PublicProfile.jsx/LevelUpModal now all use
  // (see xpLevel.js), so this card could show a different level than
  // Profile for the same user. getLevelProgress already returns the XP
  // span for the *current* level, so "remaining" is just needed - current.
  const xpRemaining = progress.needed - progress.current;

  // Audit fix: thresholds aligned with Profile.jsx/useAnalyticsStats.js —
  // previously this card used its own (level<3/<5/<10/<20) table, which,
  // combined with the different level formula above, meant this card's
  // rank label rarely matched the rank shown on Profile/Analytics for the
  // same user.
  const RANKS = [
    "Beginner",
    "Learner",
    "Intermediate",
    "Advanced",
    "Expert",
  ];

  const rank =
    level < 5
      ? RANKS[0]
      : level < 15
        ? RANKS[1]
        : level < 30
          ? RANKS[2]
          : level < 60
            ? RANKS[3]
            : RANKS[4];




  return (
    <SectionCard>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">

        <div className="min-w-0">
          <p className="text-[var(--muted-foreground)] text-sm">
            {theme.words.rank}
          </p>

          <h2 className="text-2xl sm:text-3xl font-bold mt-2 break-words">
            {rank}
          </h2>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-[var(--muted-foreground)] text-sm">
            {theme.words.level}
          </p>

          <h2 className="text-2xl sm:text-3xl font-bold mt-2">
            {level}
          </h2>

          <p className="text-[var(--muted-foreground)] text-sm mt-1" data-testid="dashboard-xp">
            {totalXP} XP
          </p>
          <p className="text-xs text-[var(--theme-primary,#2dd4bf)] mt-1">
            {progress.percent}% to Level {level + 1}
          </p>
        </div>

      </div>

      <div className="w-full bg-[var(--surface-elevated)] rounded-full h-4 overflow-hidden">
        <div
          className="bg-[var(--theme-primary,#2dd4bf)] h-full rounded-full transition-all duration-700"
          style={{
            width: `${progress.percent}%`,
          }}
        />
      </div>

      <p className="text-xs text-[var(--muted-foreground)] mt-2">
        Keep solving problems to reach the next level.
      </p>

      <div className="flex justify-between flex-wrap gap-2 mt-3 text-sm">

        <p className="text-[var(--muted-foreground)]">
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