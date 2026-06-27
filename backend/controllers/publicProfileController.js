import User from "../models/User.js";
import Submission from "../models/Submission.js";

export async function getPublicProfile(req, res) {
  try {
    const { username } = req.params;

    const user = await User.findOne({
      username: username.toLowerCase(),
    }).lean();

    if (!user) {
      return res.status(404).json({ error: "Profile not found" });
    }

    if (!user.isProfilePublic) {
      return res.status(403).json({ error: "This profile is private" });
    }

    const level = Math.floor((user.totalXP || 0) / 100) + 1;

    // ── Language breakdown — from accepted submissions ─────────────────────
    // Count accepted submissions per language.
    // This is what recruiters actually want to see — not just "50 problems solved"
    // but "50 problems solved: 30 Python, 15 Java, 5 C++"
    const acceptedSubmissions = await Submission
      .find({
        userId: user._id,
        status: "Accepted 🎉",
      })
      .select("language problemSlug")
      .lean();

    // Count per language
    const languageCounts = {};
    // Unique accepted slugs per language (one problem may be solved in multiple languages)
    const solvedPerLanguage = {};
    for (const sub of acceptedSubmissions) {
      languageCounts[sub.language] = (languageCounts[sub.language] || 0) + 1;
      if (!solvedPerLanguage[sub.language]) solvedPerLanguage[sub.language] = new Set();
      solvedPerLanguage[sub.language].add(sub.problemSlug);
    }

    const languageBreakdown = Object.entries(solvedPerLanguage)
      .map(([lang, slugSet]) => ({ language: lang, solved: slugSet.size }))
      .sort((a, b) => b.solved - a.solved);

    // ── Recent activity (last 5 solves for profile feed) ──────────────────
    const recentSolves = (user.recentActivity || [])
      .slice(0, 5)
      .map((a) => ({
        slug: a.slug,
        title: a.title,
        difficulty: a.difficulty,
        time: a.time,
      }));

    return res.json({
      username:        user.username,
      displayName:     user.displayName,
      joinedDate:      user.joinedDate,
      totalXP:         user.totalXP || 0,
      level,
      solvedCount:     user.solvedSlugs?.length ?? 0,
      currentStreak:   user.currentStreak || 0,
      longestStreak:   user.longestStreak || 0,
      solvedDifficulty: user.solvedDifficulty || { easy: 0, medium: 0, hard: 0 },
      topicStats:      Object.fromEntries(user.topicStats || []),
      achievements:    user.achievements || [],
      activityDates:   user.activityDates || [],
      // New fields for recruiter-useful profile
      languageBreakdown,
      recentSolves,
      totalSubmissions: acceptedSubmissions.length,
    });

  } catch (err) {
    console.error("[PublicProfile]", err.message);
    return res.status(500).json({ error: "Failed to load profile" });
  }
}
