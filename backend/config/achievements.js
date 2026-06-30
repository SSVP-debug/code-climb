/**
 * Achievement keys — all achievements earned on the platform.
 * Keys are stored in User.achievements[].key in MongoDB.
 * Display metadata (label, icon, description) is in frontend achievementMeta.js
 */
export const ACHIEVEMENTS = {
  // ── Solve milestones ──────────────────────────────────────────────────────
  FIRST_SOLVE:       "first_solve",
  SOLVE_10:          "solve_10",
  SOLVE_25:          "solve_25",
  SOLVE_50:          "solve_50",
  SOLVE_100:         "solve_100",
  SOLVE_200:         "solve_200",
  SOLVE_250:         "solve_250",

  // ── Difficulty milestones ─────────────────────────────────────────────────
  FIRST_HARD:        "first_hard",
  HARD_10:           "hard_10",
  HARD_25:           "hard_25",
  EASY_SWEEP:        "easy_sweep",       // solve 50 easy problems
  MEDIUM_MASTER:     "medium_master",    // solve 50 medium problems

  // ── Streak milestones ─────────────────────────────────────────────────────
  STREAK_3:          "streak_3",
  STREAK_7:          "streak_7",
  STREAK_14:         "streak_14",
  STREAK_30:         "streak_30",
  STREAK_100:        "streak_100",

  // ── Topic mastery ─────────────────────────────────────────────────────────
  TOPIC_MASTER_10:   "topic_master_10",  // 10 solves in one topic
  TOPIC_MASTER_20:   "topic_master_20",  // 20 solves in one topic
  POLYGLOT:          "polyglot",         // solved in 4 languages (tracked via submissions)
  DP_LOVER:          "dp_lover",         // 15 DP problems solved
  GRAPH_GURU:        "graph_guru",       // 10 Graph problems solved
  TREE_CLIMBER:      "tree_climber",     // 10 Tree problems solved

  // ── Speed / XP milestones ─────────────────────────────────────────────────
  XP_500:            "xp_500",
  XP_1000:           "xp_1000",
  XP_5000:           "xp_5000",
  LEVEL_10:          "level_10",
  LEVEL_25:          "level_25",

  // ── Social / profile ──────────────────────────────────────────────────────
  PROFILE_COMPLETE:  "profile_complete",  // has username + public profile
};
