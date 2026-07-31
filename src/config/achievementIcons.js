import {
  Target,
  ListChecks,
  Trophy,
  Award,
  BadgeCheck,
  Rocket,
  GraduationCap,
  Flame,
  Swords,
  Sparkles,
  Zap,
  Medal,
  TrendingUp,
  Shield,
  Brain,
  Puzzle,
  Globe,
  Layers,
  Radar as RadarIcon,
  Sprout,
  CheckCircle2,
} from "lucide-react";

/**
 * ACHIEVEMENT_ICONS
 *
 * Single source of truth for which lucide icon represents each achievement.
 * Keys MUST match ACHIEVEMENT_METADATA in achievementMetadata.js exactly —
 * that file owns title/description copy, this file owns the icon, same
 * split already used between themeSchema.js (words) and themeIcons.js
 * (icons) for the theme system.
 *
 * A static map (not a dynamic lucide-react[iconName] lookup) so every icon
 * actually used has a literal import site — see learningPathIcons.js for
 * why this convention exists in this codebase.
 *
 * Consumed by: AchievementToast, AchievementGallery, RecentAchievementCard,
 * PublicProfileAchievements.
 */
export const ACHIEVEMENT_ICONS = {
  // ── Solve milestones ──────────────────────────────────────────────────────
  first_solve: Target,
  solve_10: ListChecks,
  solve_25: Trophy,
  solve_50: Award,
  solve_100: BadgeCheck,
  solve_200: Rocket,
  solve_250: GraduationCap,

  // ── Difficulty milestones ─────────────────────────────────────────────────
  first_hard: Flame,
  hard_10: Swords,
  hard_25: Sparkles,
  easy_sweep: Zap,
  medium_master: Medal,

  // ── Streak milestones ─────────────────────────────────────────────────────
  streak_3: Zap,
  streak_7: Flame,
  streak_14: TrendingUp,
  streak_30: Sparkles,
  streak_100: Shield,

  // ── Topic mastery ─────────────────────────────────────────────────────────
  topic_master_10: Brain,
  topic_master_20: Puzzle,
  polyglot: Globe,
  dp_lover: Layers,
  graph_guru: RadarIcon,
  tree_climber: Sprout,

  // ── Speed / XP milestones ─────────────────────────────────────────────────
  xp_500: Zap,
  xp_1000: Sparkles,
  xp_5000: Sparkles,
  level_10: TrendingUp,
  level_25: Award,

  // ── Social / profile ──────────────────────────────────────────────────────
  profile_complete: CheckCircle2,
};

/** Fallback for any achievement key without a mapped icon. */
export const DEFAULT_ACHIEVEMENT_ICON = Trophy;