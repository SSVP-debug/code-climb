import User from "../models/User.js";

export async function getPublicProfile(
  req,
  res
) {
  try {
    const { username } =
      req.params;

    const user =
      await User.findOne({
        username:
          username.toLowerCase(),
      });

    if (!user) {
      return res.status(404).json({
        error:
          "Profile not found",
      });
    }

    if (
      !user.isProfilePublic
    ) {
      return res.status(403).json({
        error:
          "Profile is private",
      });
    }

    const level =
      Math.floor(
        (user.totalXP || 0) / 100
      ) + 1;

    res.json({
      username:
        user.username,

      displayName:
        user.displayName,

      joinedDate:
        user.joinedDate,

      totalXP:
        user.totalXP || 0,

      level,

      solvedCount:
        user.solvedSlugs.length,

      currentStreak:
        user.currentStreak,

      longestStreak:
        user.longestStreak,

      solvedDifficulty:
        user.solvedDifficulty,

      topicStats:
        Object.fromEntries(
          user.topicStats || []
        ),

      achievements:
        user.achievements || [],

      activityDates:
        user.activityDates || [],
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error:
        "Failed to load profile",
    });
  }
}