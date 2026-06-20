import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "./authContext";

import {
  getProgress,
  initProgress,
  markProblemSolved as persistSolvedToMongo,
} from "../services/progressService";

import {
  getSubmissions,
  createSubmission,
} from "../services/submissionService";

import problems from "../data/problems";

export const AppContext = createContext(null);

function calculateCurrentStreak(activityDates = []) {
  if (!activityDates.length) return 0;

  const sorted = [...new Set(activityDates)].sort();

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const yesterday = new Date(
    Date.now() - 86400000
  )
    .toISOString()
    .split("T")[0];

  const lastDate = sorted[sorted.length - 1];

  if (
    lastDate !== today &&
    lastDate !== yesterday
  ) {
    return 0;
  }

  let streak = 1;

  for (let i = sorted.length - 1; i > 0; i--) {
    const curr = new Date(sorted[i]);
    const prev = new Date(sorted[i - 1]);

    const diff =
      (curr - prev) /
      (1000 * 60 * 60 * 24);

    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function AppContextProvider({ children }) {
  const { user } = useAuth();

  const [solvedProblems, setSolvedProblems] =
    useState([]);

  const [topicStats, setTopicStats] =
    useState({});

  const [activityDates, setActivityDates] =
    useState([]);

  const [solvedDifficulty, setSolvedDifficulty] =
    useState({
      easy: 0,
      medium: 0,
      hard: 0,
    });

  const [recentActivity, setRecentActivity] =
    useState([]);

  const [currentStreak, setCurrentStreak] =
    useState(0);

  const [longestStreak, setLongestStreak] =
    useState(0);

  const [lastActivityDate, setLastActivityDate] =
    useState(null);

  const [submissions, setSubmissions] =
    useState([]);
  const [achievements, setAchievements] =
    useState([]);
  const [dailyChallengeHistory, setDailyChallengeHistory,] =
    useState([]);

  // --------------------------------------------------
  // HYDRATE FROM MONGODB
  // --------------------------------------------------

  useEffect(() => {
    if (!user) return;

    async function hydrate() {
      try {
        await initProgress();

        const progress =
          await getProgress();

        const mongoSubmissions =
          await getSubmissions();

        setSolvedProblems(
          progress.solvedSlugs || []
        );

        setTopicStats(
          progress.topicStats || {}
        );

        setActivityDates(
          progress.activityDates || []
        );

        setSolvedDifficulty(
          progress.solvedDifficulty || {
            easy: 0,
            medium: 0,
            hard: 0,
          }
        );

        setRecentActivity(
          progress.recentActivity || []
        );

        setCurrentStreak(
          progress.currentStreak || 0
        );

        setAchievements(
          progress.achievements || []
        );

        setDailyChallengeHistory(
          progress.dailyChallengeHistory || []
        );

        setLongestStreak(
          progress.longestStreak || 0
        );

        setLastActivityDate(
          progress.lastActivityDate || null
        );

        setSubmissions(
          mongoSubmissions || []
        );

        console.log(
          "[AppContext] Hydrated from MongoDB"
        );
      } catch (err) {
        console.error(
          "[AppContext] Hydration failed:",
          err
        );
      }
    }

    hydrate();
  }, [user]);

  // --------------------------------------------------
  // SUBMISSIONS
  // --------------------------------------------------

  async function addSubmission(submission) {
    setSubmissions((prev) => [
      submission,
      ...prev,
    ]);

    if (!user) return;

    try {
      await createSubmission({
        problemSlug:
          submission.problemSlug,
        language:
          submission.language,
        code:
          submission.code ||
          "// code not stored",
        status:
          submission.status,
        passed:
          submission.passed || 0,
        total:
          submission.total || 0,
        executionTime:
          submission.executionTime ||
          null,
        output:
          submission.actualOutput ||
          "",
      });

      console.log(
        "✅ Submission saved to MongoDB"
      );
    } catch (err) {
      console.error(
        "[AppContext] Submission save failed:",
        err
      );
    }
  }

  // --------------------------------------------------
  // PROGRESS
  // --------------------------------------------------

  async function markProblemSolved({
    slug,
    topic,
    difficulty,
    title,
  }) {
    if (solvedProblems.includes(slug)) {
      return;
    }

    const today = new Date()
      .toISOString()
      .split("T")[0];

    const nextSolvedProblems = [
      ...solvedProblems,
      slug,
    ];

    const nextTopicStats = {
      ...topicStats,
      [topic]:
        (topicStats[topic] || 0) + 1,
    };

    const nextActivityDates =
      activityDates.includes(today)
        ? activityDates
        : [...activityDates, today];

    const difficultyKey =
      difficulty.toLowerCase();

    const nextSolvedDifficulty = {
      ...solvedDifficulty,
      [difficultyKey]:
        (solvedDifficulty[
          difficultyKey
        ] || 0) + 1,
    };

    const nextRecentActivity = [
      {
        title,
        time: today,
      },
      ...recentActivity,
    ].slice(0, 10);

    const nextCurrentStreak =
      calculateCurrentStreak(
        nextActivityDates
      );

    const nextLongestStreak =
      Math.max(
        longestStreak,
        nextCurrentStreak
      );

    // Local UI update first

    setSolvedProblems(
      nextSolvedProblems
    );

    setTopicStats(
      nextTopicStats
    );

    setActivityDates(
      nextActivityDates
    );

    setSolvedDifficulty(
      nextSolvedDifficulty
    );

    setRecentActivity(
      nextRecentActivity
    );

    setCurrentStreak(
      nextCurrentStreak
    );

    setLongestStreak(
      nextLongestStreak
    );

    setLastActivityDate(today);

    // MongoDB

    try {
      const response =
        await persistSolvedToMongo(
          {
            solvedSlugs:
              nextSolvedProblems,

            topicStats:
              nextTopicStats,

            activityDates:
              nextActivityDates,

            solvedDifficulty:
              nextSolvedDifficulty,

            recentActivity:
              nextRecentActivity,
          },
          slug,
          difficulty
        );

      if (response) {
        setCurrentStreak(
          response.currentStreak ??
          nextCurrentStreak
        );

        setLongestStreak(
          response.longestStreak ??
          nextLongestStreak
        );

        setLastActivityDate(
          response.lastActivityDate ??
          today
        );
      }

      console.log(
        "✅ Progress saved to MongoDB"
      );
    } catch (err) {
      console.error(
        "[AppContext] Progress save failed:",
        err
      );
    }
  }

  // --------------------------------------------------
  // XP
  // --------------------------------------------------

  const totalXP = useMemo(() => {
    return solvedProblems.reduce(
      (sum, slug) => {
        const p = problems.find(
          (x) => x.slug === slug
        );

        return (
          sum + (p?.xp || 0)
        );
      },
      0
    );
  }, [solvedProblems]);

  // --------------------------------------------------
  // CONTEXT
  // --------------------------------------------------

  const value = {
    solvedProblems,
    topicStats,
    achievements,
    dailyChallengeHistory,
    activityDates,
    solvedDifficulty,
    recentActivity,
    currentStreak,
    longestStreak,
    lastActivityDate,
    submissions,
    totalXP,
    addSubmission,
    markProblemSolved,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context =
    useContext(AppContext);

  if (!context) {
    throw new Error(
      "useAppContext must be used inside AppContextProvider"
    );
  }

  return context;
}

export default AppContextProvider;