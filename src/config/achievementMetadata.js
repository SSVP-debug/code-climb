/**
 * ACHIEVEMENT_METADATA
 *
 * Single source of truth for achievement display data (title, publicTitle,
 * description, icon) on the frontend. Keys MUST match
 * backend/config/achievements.js exactly — that file is the source of
 * truth for which keys exist; this file is the source of truth for how
 * they're displayed.
 *
 * Consumed by: AchievementToast, AchievementGallery, RecentAchievementCard,
 * PublicProfile.
 *
 * `title` — shown to the achievement's owner (dashboard, toast)
 * `publicTitle` — shown on public/recruiter-facing profile pages
 * `description` — shown in both contexts
 *
 * Icon is intentionally NOT stored here — see achievementIcons.js for the
 * key → lucide-icon map. Splitting content (this file) from icon (that
 * file) mirrors the themeSchema.js / themeIcons.js split already used by
 * the theme system.
 */
export const ACHIEVEMENT_METADATA = {
  // ── Solve milestones ──────────────────────────────────────────────────────
  first_solve: {
    title: "First Blood",
    publicTitle: "Solved First Problem",
    description: "Solved your first problem.",
  },
  solve_10: {
    title: "Getting Started",
    publicTitle: "Solved 10 Problems",
    description: "Solved 10 problems.",
  },
  solve_25: {
    title: "Problem Crusher",
    publicTitle: "Solved 25 Problems",
    description: "Solved 25 problems.",
  },
  solve_50: {
    title: "DSA Warrior",
    publicTitle: "Solved 50 Problems",
    description: "Solved 50 problems.",
  },
  solve_100: {
    title: "Century Club",
    publicTitle: "Solved 100 Problems",
    description: "Solved 100 problems.",
  },
  solve_200: {
    title: "Elite Solver",
    publicTitle: "Solved 200 Problems",
    description: "Solved 200 problems.",
  },
  solve_250: {
    title: "Completionist",
    publicTitle: "Solved Every Problem",
    description: "Solved all 250 problems on the platform.",
  },

  // ── Difficulty milestones ─────────────────────────────────────────────────
  first_hard: {
    title: "Maximum Security",
    publicTitle: "Solved First Hard Problem",
    description: "Solved your first Hard problem.",
  },
  hard_10: {
    title: "Hard Mode",
    publicTitle: "Solved 10 Hard Problems",
    description: "Solved 10 Hard problems.",
  },
  hard_25: {
    title: "Hardcore",
    publicTitle: "Solved 25 Hard Problems",
    description: "Solved 25 Hard problems.",
  },
  easy_sweep: {
    title: "Easy Sweep",
    publicTitle: "Solved 50 Easy Problems",
    description: "Solved 50 Easy problems.",
  },
  medium_master: {
    title: "Medium Master",
    publicTitle: "Solved 50 Medium Problems",
    description: "Solved 50 Medium problems.",
  },

  // ── Streak milestones ─────────────────────────────────────────────────────
  streak_3: {
    title: "Warming Up",
    publicTitle: "3 Day Streak",
    description: "Maintained a 3 day streak.",
  },
  streak_7: {
    title: "Hot Streak",
    publicTitle: "7 Day Streak",
    description: "Maintained a 7 day streak.",
  },
  streak_14: {
    title: "On a Roll",
    publicTitle: "14 Day Streak",
    description: "Maintained a 14 day streak.",
  },
  streak_30: {
    title: "Unstoppable",
    publicTitle: "30 Day Streak",
    description: "Maintained a 30 day streak.",
  },
  streak_100: {
    title: "Iron Will",
    publicTitle: "100 Day Streak",
    description: "Maintained a 100 day streak.",
  },

  // ── Topic mastery ─────────────────────────────────────────────────────────
  topic_master_10: {
    title: "Topic Master",
    publicTitle: "Topic Specialist",
    description: "Solved 10 problems in one topic.",
  },
  topic_master_20: {
    title: "Topic Grandmaster",
    publicTitle: "Topic Expert",
    description: "Solved 20 problems in one topic.",
  },
  polyglot: {
    title: "Polyglot",
    publicTitle: "Multi-Language Solver",
    description: "Solved problems in 4 different languages.",
  },
  dp_lover: {
    title: "DP Lover",
    publicTitle: "Dynamic Programming Enthusiast",
    description: "Solved 15 Dynamic Programming problems.",
  },
  graph_guru: {
    title: "Graph Guru",
    publicTitle: "Graph Specialist",
    description: "Solved 10 Graph problems.",
  },
  tree_climber: {
    title: "Tree Climber",
    publicTitle: "Tree Specialist",
    description: "Solved 10 Tree problems.",
  },

  // ── Speed / XP milestones ─────────────────────────────────────────────────
  xp_500: {
    title: "Rising Star",
    publicTitle: "Earned 500 XP",
    description: "Earned 500 total XP.",
  },
  xp_1000: {
    title: "XP Grinder",
    publicTitle: "Earned 1,000 XP",
    description: "Earned 1,000 total XP.",
  },
  xp_5000: {
    title: "XP Legend",
    publicTitle: "Earned 5,000 XP",
    description: "Earned 5,000 total XP.",
  },
  level_10: {
    title: "Level 10",
    publicTitle: "Reached Level 10",
    description: "Reached level 10.",
  },
  level_25: {
    title: "Level 25",
    publicTitle: "Reached Level 25",
    description: "Reached level 25.",
  },

  // ── Social / profile ──────────────────────────────────────────────────────
  profile_complete: {
    title: "All Set",
    publicTitle: "Completed Profile",
    description: "Set a username and made your profile public.",
  },
};

/**
 * Ordered array form, for components that render a full checklist
 * (locked + unlocked) rather than doing key lookups.
 */
export const ACHIEVEMENTS_LIST = Object.entries(ACHIEVEMENT_METADATA).map(
  ([key, meta]) => ({ key, ...meta })
);