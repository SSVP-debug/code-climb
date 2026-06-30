/**
 * Weekly Season Challenge
 *
 * GET  /api/weekly/current  — returns this week's challenge + leaderboard
 * POST /api/weekly/submit   — mark a problem as completed for weekly challenge
 *
 * Logic: each week (Mon–Sun UTC) has 3 challenge problems.
 * Users who complete all 3 get bonus XP. Top 3 get exclusive theme unlock.
 * Resets automatically every Monday 00:00 UTC.
 */
import { Router } from "express";
import Problem from "../models/Problem.js";

const router = Router();

// Deterministic week-based problem selection
function getWeekKey() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.floor((now - startOfYear) / (7 * 24 * 60 * 60 * 1000));
  return `${now.getFullYear()}-W${week}`;
}

function seededRandom(seed, max) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h % max;
}

router.get("/current", async (req, res) => {
  try {
    const weekKey = getWeekKey();
    const allProblems = await Problem.find({})
      .select("slug title difficulty topic companies")
      .lean();

    if (allProblems.length < 3) {
      return res.json({ weekKey, problems: [], message: "Not enough problems seeded yet." });
    }

    // Pick 3 deterministic problems for this week (1 easy, 1 medium, 1 hard)
    const easy   = allProblems.filter(p => p.difficulty === "Easy");
    const medium = allProblems.filter(p => p.difficulty === "Medium");
    const hard   = allProblems.filter(p => p.difficulty === "Hard");

    const pick = (arr, seed) => arr[seededRandom(weekKey + seed, arr.length)];

    const weeklyProblems = [
      pick(easy,   "easy"),
      pick(medium, "medium"),
      pick(hard,   "hard"),
    ].filter(Boolean);

    // Monday reset info
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sun
    const daysUntilMonday = dayOfWeek === 1 ? 7 : (8 - dayOfWeek) % 7;
    const resetAt = new Date(now);
    resetAt.setUTCDate(now.getUTCDate() + daysUntilMonday);
    resetAt.setUTCHours(0, 0, 0, 0);

    return res.json({
      weekKey,
      problems: weeklyProblems,
      resetAt: resetAt.toISOString(),
      bonusXP: 150,       // bonus for completing all 3
      exclusiveReward: "Weekly Champion badge",
    });

  } catch (err) {
    console.error("[Weekly] error:", err.message);
    return res.status(500).json({ error: "Failed to load weekly challenge." });
  }
});

export default router;
