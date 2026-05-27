function mapTopicStats(topicStats) {
  if (topicStats instanceof Map) {
    return Object.fromEntries(topicStats);
  }

  return topicStats || {};
}

export function progressToClient(user) {
  return {
    solvedSlugs: user.solvedSlugs || [],
    topicStats: mapTopicStats(user.topicStats),
    activityDates: user.activityDates || [],
    solvedDifficulty: user.solvedDifficulty || {
      easy: 0,
      medium: 0,
      hard: 0,
    },
    recentActivity: user.recentActivity || [],
    joinedDate: user.joinedDate,
    leetcodeUsername: user.leetcodeUsername || "",
  };
}

export async function getProgress(req, res) {
  res.json(progressToClient(req.userDoc));
}

export async function putProgress(req, res) {
  const {
    solvedSlugs,
    topicStats,
    activityDates,
    solvedDifficulty,
    recentActivity,
    leetcodeUsername,
  } = req.body;

  if (Array.isArray(solvedSlugs)) {
    req.userDoc.solvedSlugs = solvedSlugs;
  }

  if (topicStats && typeof topicStats === "object") {
    req.userDoc.topicStats = new Map(
      Object.entries(topicStats)
    );
  }

  if (Array.isArray(activityDates)) {
    req.userDoc.activityDates = activityDates;
  }

  if (solvedDifficulty && typeof solvedDifficulty === "object") {
    req.userDoc.solvedDifficulty = {
      easy: solvedDifficulty.easy ?? 0,
      medium: solvedDifficulty.medium ?? 0,
      hard: solvedDifficulty.hard ?? 0,
    };
  }

  if (Array.isArray(recentActivity)) {
    req.userDoc.recentActivity = recentActivity.slice(0, 10);
  }

  if (leetcodeUsername !== undefined) {
    req.userDoc.leetcodeUsername = leetcodeUsername;
  }

  await req.userDoc.save();

  res.json(progressToClient(req.userDoc));
}
