import problems from "../data/problems";

import {
  getStorageData,
} from "../services/storageService";

// Submissions
export function getAllSubmissions() {

  return getStorageData(
    "allSubmissions",
    []
  );

}

// Solved Problems
export function getSolvedProblems() {

  return getStorageData(
    "codeclimbSolved",
    []
  );

}

// Acceptance Rate
export function getAcceptanceRate() {

  const submissions =
    getAllSubmissions();

  if (submissions.length === 0) {

    return 0;

  }

  const accepted =
    submissions.filter(
      (submission) =>
        submission.status ===
        "Accepted 🎉"
    ).length;

  return (
    (
      accepted /
      submissions.length
    ) * 100
  ).toFixed(1);

}

// Average Runtime
export function getAverageRuntime() {

  const submissions =
    getAllSubmissions();

  const acceptedSubmissions =
    submissions.filter(
      (submission) =>
        submission.status ===
        "Accepted 🎉"
    );

  if (
    acceptedSubmissions.length === 0
  ) {

    return 0;

  }

  const totalRuntime =
    acceptedSubmissions.reduce(
      (sum, submission) => {

        return (
          sum +
          Number(
            submission.executionTime || 0
          )
        );

      },
      0
    );

  return (
    totalRuntime /
    acceptedSubmissions.length
  ).toFixed(2);

}

// Language Stats
export function getLanguageStats() {

  const submissions =
    getAllSubmissions();

  const stats = {};

  submissions.forEach(
    (submission) => {

      const language =
        submission.language;

      stats[language] =
        (stats[language] || 0) + 1;

    }
  );

  return stats;

}

// Topic Stats
export function getTopicStats() {

  return getStorageData(
    "topicStats",
    {}
  );

}

// Weakest Topic
export function getWeakestTopic() {

  const topicStats =
    getTopicStats();

  const topics =
    Object.entries(topicStats);

  if (topics.length === 0) {

    return "N/A";

  }

  topics.sort(
    (a, b) => a[1] - b[1]
  );

  return topics[0][0];

}

// Strongest Topic
export function getStrongestTopic() {

  const topicStats =
    getTopicStats();

  const topics =
    Object.entries(topicStats);

  if (topics.length === 0) {

    return "N/A";

  }

  topics.sort(
    (a, b) => b[1] - a[1]
  );

  return topics[0][0];

}

// User Rank
export function getUserRank() {

  const solvedProblems =
    getSolvedProblems();

  const solvedCount =
    solvedProblems.length;

  if (solvedCount < 5) {

    return "Beginner";

  }

  if (solvedCount < 15) {

    return "Learner";

  }

  if (solvedCount < 30) {

    return "Intermediate";

  }

  if (solvedCount < 60) {

    return "Advanced";

  }

  return "Expert";

}

// User Level
export function getUserLevel() {

  const solvedProblems =
    getSolvedProblems();

  return solvedProblems.length;

}

// Achievements
export function getAchievements() {

  const solvedProblems =
    getSolvedProblems();

  const submissions =
    getAllSubmissions();

  const achievements = [];

  if (solvedProblems.length >= 1) {

    achievements.push({
      title: "First Blood",
      description:
        "Solved your first problem.",
    });

  }

  if (solvedProblems.length >= 5) {

    achievements.push({
      title:
        "Consistency Begins",

      description:
        "Solved 5 problems.",
    });

  }

  if (solvedProblems.length >= 25) {

    achievements.push({
      title:
        "Problem Crusher",

      description:
        "Solved 25 problems.",
    });

  }

  if (solvedProblems.length >= 50) {

    achievements.push({
      title: "DSA Warrior",

      description:
        "Solved 50 problems.",
    });

  }

  const fastSubmission =
    submissions.find(
      (submission) =>
        Number(
          submission.executionTime
        ) < 100
    );

  if (fastSubmission) {

    achievements.push({
      title: "Speed Demon",

      description:
        "Achieved runtime under 100ms.",
    });

  }

  return achievements;

}

// Daily Challenge
export function getDailyChallenge() {

  const today =
    new Date()
      .toLocaleDateString();

  const seed =
    today
      .split("/")
      .join("");

  const index =
    Number(seed) %
    problems.length;

  return problems[index];

}

// Public Profile
export function getProfileData() {

  const solvedProblems =
    getSolvedProblems();

  const submissions =
    getAllSubmissions();

  const topicStats =
    getTopicStats();

  return {

    totalSolved:
      solvedProblems.length,

    totalSubmissions:
      submissions.length,

    topicsSolved:
      Object.keys(topicStats).length,

    joinedDate:
      localStorage.getItem(
        "joinedDate"
      ) || "Today",

  };

}