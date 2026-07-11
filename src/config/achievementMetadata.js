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
 * `icon` — emoji shown alongside title
 */
export const ACHIEVEMENT_METADATA = {
  // ── Solve milestones ──────────────────────────────────────────────────────
  first_solve: {
    title: "First Blood",
    publicTitle: "Solved First Problem",
    description: "Solved your first problem.",
    icon: "🎯",
  },
  solve_10: {
    title: "Getting Started",
    publicTitle: "Solved 10 Problems",
    description: "Solved 10 problems.",
    icon: "🔟",
  },
  solve_25: {
    title: "Problem Crusher",
    publicTitle: "Solved 25 Problems",
    description: "Solved 25 problems.",
    icon: "🏆",
  },
  solve_50: {
    title: "DSA Warrior",
    publicTitle: "Solved 50 Problems",
    description: "Solved 50 problems.",
    icon: "👑",
  },
  solve_100: {
    title: "Century Club",
    publicTitle: "Solved 100 Problems",
    description: "Solved 100 problems.",
    icon: "💯",
  },
  solve_200: {
    title: "Elite Solver",
    publicTitle: "Solved 200 Problems",
    description: "Solved 200 problems.",
    icon: "🚀",
  },
  solve_250: {
    title: "Completionist",
    publicTitle: "Solved Every Problem",
    description: "Solved all 250 problems on the platform.",
    icon: "🎓",
  },

  // ── Difficulty milestones ─────────────────────────────────────────────────
  first_hard: {
    title: "Maximum Security",
    publicTitle: "Solved First Hard Problem",
    description: "Solved your first Hard problem.",
    icon: "🔥",
  },
  hard_10: {
    title: "Hard Mode",
    publicTitle: "Solved 10 Hard Problems",
    description: "Solved 10 Hard problems.",
    icon: "⚔️",
  },
  hard_25: {
    title: "Hardcore",
    publicTitle: "Solved 25 Hard Problems",
    description: "Solved 25 Hard problems.",
    icon: "🗡️",
  },
  easy_sweep: {
    title: "Easy Sweep",
    publicTitle: "Solved 50 Easy Problems",
    description: "Solved 50 Easy problems.",
    icon: "🧹",
  },
  medium_master: {
    title: "Medium Master",
    publicTitle: "Solved 50 Medium Problems",
    description: "Solved 50 Medium problems.",
    icon: "🎖️",
  },

  // ── Streak milestones ─────────────────────────────────────────────────────
  streak_3: {
    title: "Warming Up",
    publicTitle: "3 Day Streak",
    description: "Maintained a 3 day streak.",
    icon: "⚡",
  },
  streak_7: {
    title: "Hot Streak",
    publicTitle: "7 Day Streak",
    description: "Maintained a 7 day streak.",
    icon: "🔥",
  },
  streak_14: {
    title: "On a Roll",
    publicTitle: "14 Day Streak",
    description: "Maintained a 14 day streak.",
    icon: "🌊",
  },
  streak_30: {
    title: "Unstoppable",
    publicTitle: "30 Day Streak",
    description: "Maintained a 30 day streak.",
    icon: "🌟",
  },
  streak_100: {
    title: "Iron Will",
    publicTitle: "100 Day Streak",
    description: "Maintained a 100 day streak.",
    icon: "🛡️",
  },

  // ── Topic mastery ─────────────────────────────────────────────────────────
  topic_master_10: {
    title: "Topic Master",
    publicTitle: "Topic Specialist",
    description: "Solved 10 problems in one topic.",
    icon: "🧠",
  },
  topic_master_20: {
    title: "Topic Grandmaster",
    publicTitle: "Topic Expert",
    description: "Solved 20 problems in one topic.",
    icon: "🧩",
  },
  polyglot: {
    title: "Polyglot",
    publicTitle: "Multi-Language Solver",
    description: "Solved problems in 4 different languages.",
    icon: "🌐",
  },
  dp_lover: {
    title: "DP Lover",
    publicTitle: "Dynamic Programming Enthusiast",
    description: "Solved 15 Dynamic Programming problems.",
    icon: "🧮",
  },
  graph_guru: {
    title: "Graph Guru",
    publicTitle: "Graph Specialist",
    description: "Solved 10 Graph problems.",
    icon: "🕸️",
  },
  tree_climber: {
    title: "Tree Climber",
    publicTitle: "Tree Specialist",
    description: "Solved 10 Tree problems.",
    icon: "🌳",
  },

  // ── Speed / XP milestones ─────────────────────────────────────────────────
  xp_500: {
    title: "Rising Star",
    publicTitle: "Earned 500 XP",
    description: "Earned 500 total XP.",
    icon: "⭐",
  },
  xp_1000: {
    title: "XP Grinder",
    publicTitle: "Earned 1,000 XP",
    description: "Earned 1,000 total XP.",
    icon: "🌟",
  },
  xp_5000: {
    title: "XP Legend",
    publicTitle: "Earned 5,000 XP",
    description: "Earned 5,000 total XP.",
    icon: "💫",
  },
  level_10: {
    title: "Level 10",
    publicTitle: "Reached Level 10",
    description: "Reached level 10.",
    icon: "🆙",
  },
  level_25: {
    title: "Level 25",
    publicTitle: "Reached Level 25",
    description: "Reached level 25.",
    icon: "🏔️",
  },

  // ── Social / profile ──────────────────────────────────────────────────────
  profile_complete: {
    title: "All Set",
    publicTitle: "Completed Profile",
    description: "Set a username and made your profile public.",
    icon: "✅",
  },
};

/**
 * Ordered array form, for components that render a full checklist
 * (locked + unlocked) rather than doing key lookups.
 */
export const ACHIEVEMENTS_LIST = Object.entries(ACHIEVEMENT_METADATA).map(
  ([key, meta]) => ({ key, ...meta })
);