import { apiFetch } from "./api";
import {
  getStorageData,
  setStorageData,
} from "./storageService";
import { PROGRESS_KEYS } from "../constants/progressKeys";

export function emptyProgress() {
  return {
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
    joinedDate: null,
  };
}

export function progressFromLocalStorage() {
  return {
    solvedSlugs: getStorageData(
      PROGRESS_KEYS.solved,
      []
    ),
    topicStats: getStorageData(
      PROGRESS_KEYS.topicStats,
      {}
    ),
    activityDates: getStorageData(
      PROGRESS_KEYS.activityDates,
      []
    ),
    solvedDifficulty: getStorageData(
      PROGRESS_KEYS.solvedDifficulty,
      {
        easy: 0,
        medium: 0,
        hard: 0,
      }
    ),
    recentActivity: getStorageData(
      PROGRESS_KEYS.recentActivity,
      []
    ),
    leetcodeUsername:
      localStorage.getItem(
        PROGRESS_KEYS.leetcodeUsername
      ) || "",
    joinedDate:
      localStorage.getItem(
        PROGRESS_KEYS.joinedDate
      ) || null,
  };
}

export function saveProgressToLocalStorage(
  progress
) {
  setStorageData(
    PROGRESS_KEYS.solved,
    progress.solvedSlugs
  );
  setStorageData(
    PROGRESS_KEYS.topicStats,
    progress.topicStats
  );
  setStorageData(
    PROGRESS_KEYS.activityDates,
    progress.activityDates
  );
  setStorageData(
    PROGRESS_KEYS.solvedDifficulty,
    progress.solvedDifficulty
  );
  setStorageData(
    PROGRESS_KEYS.recentActivity,
    progress.recentActivity
  );

  if (progress.leetcodeUsername) {
    localStorage.setItem(
      PROGRESS_KEYS.leetcodeUsername,
      progress.leetcodeUsername
    );
  }

  if (progress.joinedDate) {
    localStorage.setItem(
      PROGRESS_KEYS.joinedDate,
      progress.joinedDate
    );
  }
}

export function migrateLegacyLocalStorage() {
  const solved = new Set(
    getStorageData(PROGRESS_KEYS.solved, [])
  );

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);

    if (key?.startsWith("solved-")) {
      const slug = key.slice("solved-".length);

      if (localStorage.getItem(key) === "true") {
        solved.add(slug);
      }

      localStorage.removeItem(key);
    }

    if (key?.startsWith("submissions-")) {
      localStorage.removeItem(key);
    }
  }

  if (solved.size > 0) {
    setStorageData(
      PROGRESS_KEYS.solved,
      [...solved]
    );
  }
}

export async function fetchProgressFromApi() {
  if (import.meta.env.DEV) {
    console.log("[Progress] Fetching progress from API...");
  }
  const progress = await apiFetch("/api/progress");
  if (import.meta.env.DEV) {
    console.log("[Progress] Fetched progress from API:", progress);
  }
  return progress;
}

export async function fetchSubmissionsFromApi() {
  if (import.meta.env.DEV) {
    console.log("[Progress] Fetching submissions from API...");
  }
  const submissions = await apiFetch("/api/submissions");
  if (import.meta.env.DEV) {
    console.log(
      "[Progress] Fetched",
      submissions.length,
      "submissions"
    );
  }
  return submissions;
}

export function mapApiSubmission(submission) {
  return {
    id:
      submission.id ||
      submission._id ||
      crypto.randomUUID(),
    problemTitle: submission.problemTitle,
    problemSlug: submission.problemSlug,
    language: submission.language,
    status: submission.status,
    passed: submission.passed,
    total: submission.total,
    visiblePassed: submission.visiblePassed,
    hiddenPassed: submission.hiddenPassed,
    executionTime: formatRuntime(formatRuntime(formatRuntime(formatRuntime(formatRuntime(formatRuntime(submission.executionTime)))))),
    expectedOutput: submission.expectedOutput,
    actualOutput: submission.actualOutput,
    time: submission.time ||
      new Date(submission.createdAt).toLocaleTimeString(),
    date: submission.date ||
      new Date(submission.createdAt).formatDate(),
  };
}

export async function saveProgressToApi(
  progress
) {
  return apiFetch("/api/progress", {
    method: "PUT",
    body: JSON.stringify(progress),
  });
}

export async function syncProgressOnLogin() {
  migrateLegacyLocalStorage();

  try {
    const [remote, apiSubmissions] = await Promise.all([
      fetchProgressFromApi(),
      fetchSubmissionsFromApi().catch(() => []),
    ]);

    saveProgressToLocalStorage(remote);

    if (apiSubmissions.length > 0) {
      const mapped = apiSubmissions.map(
        mapApiSubmission
      );
      setStorageData(
        PROGRESS_KEYS.submissions,
        mapped
      );
    }

    return {
      progress: remote,
      submissions: getStorageData(
        PROGRESS_KEYS.submissions,
        []
      ),
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(
        "[Progress] API sync failed, using local cache:",
        error.message
      );
    }

    const local = progressFromLocalStorage();

    try {
      await saveProgressToApi(local);
      if (import.meta.env.DEV) {
        console.log(
          "[Progress] Pushed local progress to API"
        );
      };
    } catch (pushError) {
      if (import.meta.env.DEV) {
        console.warn(
          "[Progress] Could not push local progress:",
          pushError.message
        );
      }
    }

    return {
      progress: local,
      submissions: getStorageData(
        PROGRESS_KEYS.submissions,
        []
      ),
    };
  }
}

export async function recordSubmission(
  submission
) {
  const submissions = getStorageData(
    PROGRESS_KEYS.submissions,
    []
  );
  const updated = [submission, ...submissions];

  setStorageData(
    PROGRESS_KEYS.submissions,
    updated
  );

  try {
    await apiFetch("/api/submissions", {
      method: "POST",
      body: JSON.stringify(submission),
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Failed to sync submission:", error);
    }
  }

  return updated;
}

export function getSubmissionsForProblem(
  slug
) {
  const all = getStorageData(
    PROGRESS_KEYS.submissions,
    []
  );

  return all.filter(
    (s) => s.problemSlug === slug
  );
}

export function buildProgressUpdate({
  solvedSlugs,
  topicStats,
  activityDates,
  solvedDifficulty,
  recentActivity,
  leetcodeUsername,
}) {
  return {
    solvedSlugs,
    topicStats,
    activityDates,
    solvedDifficulty,
    recentActivity,
    leetcodeUsername,
  };
}

export async function persistProgress(
  progress
) {
  saveProgressToLocalStorage(progress);

  try {
    await saveProgressToApi(progress);
  } catch (error) {
    console.error("Failed to sync progress:", error);
  }
}

export function markProblemSolvedInProgress(
  progress,
  { slug, topic, difficulty, title }
) {
  const solvedSlugs = progress.solvedSlugs.includes(
    slug
  )
    ? progress.solvedSlugs
    : [...progress.solvedSlugs, slug];

  const topicStats = {
    ...progress.topicStats,
    [topic]:
      (progress.topicStats[topic] || 0) + 1,
  };

  const solvedDifficulty = {
    ...progress.solvedDifficulty,
  };

  if (difficulty === "Easy") {
    solvedDifficulty.easy += 1;
  } else if (difficulty === "Medium") {
    solvedDifficulty.medium += 1;
  } else {
    solvedDifficulty.hard += 1;
  }

  const today = new Date().formatDate();
  const activityDates =
    progress.activityDates.includes(today)
      ? progress.activityDates
      : [...progress.activityDates, today];

  const recentActivity = [
    {
      title,
      time: new Date().formatDateTime(),
    },
    ...progress.recentActivity,
  ].slice(0, 10);

  return buildProgressUpdate({
    solvedSlugs,
    topicStats,
    activityDates,
    solvedDifficulty,
    recentActivity,
    leetcodeUsername:
      progress.leetcodeUsername,
  });
}
