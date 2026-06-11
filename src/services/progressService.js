import { apiFetch } from "./api";
import { getSubmissions } from "./submissionService";
const DEFAULT_PROGRESS = {
  solvedSlugs: [],
  topicStats: {},
  activityDates: [],
  solvedDifficulty: {
    easy: 0,
    medium: 0,
    hard: 0,
  },
  recentActivity: [],
  leetcodeUsername: "",
};

export async function getProgress() {
  try {
    return await apiFetch("/api/progress");
  } catch (err) {
    console.error(
      "[progressService] getProgress failed:",
      err.message
    );

    return DEFAULT_PROGRESS;
  }
}

export async function initProgress() {
  // MongoDB user document already exists after login.
  return getProgress();
}

export async function markProblemSolved(
  currentProgress,
  problemSlug,
  difficulty
) {
  const solvedSlugs = Array.from(
    new Set([
      ...(currentProgress.solvedSlugs || []),
      problemSlug,
    ])
  );

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const activityDates = Array.from(
    new Set([
      ...(currentProgress.activityDates || []),
      today,
    ])
  );

  const solvedDifficulty = {
    ...(currentProgress.solvedDifficulty || {
      easy: 0,
      medium: 0,
      hard: 0,
    }),
  };

  const key = difficulty.toLowerCase();

  solvedDifficulty[key] =
    (solvedDifficulty[key] || 0) + 1;

  return apiFetch("/api/progress", {
    method: "PUT",
    body: JSON.stringify({
      solvedSlugs,
      activityDates,
      solvedDifficulty,
    }),
  });
}

export async function syncProgressOnLogin() {
  const [progress, submissions] = await Promise.all([
    getProgress(),
    getSubmissions(),
  ]);

  return {
    progress,
    submissions,
  };
}