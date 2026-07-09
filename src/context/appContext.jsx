import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "./authContext";

import {
  markProblemSolved as persistSolvedToMongo,
} from "../services/progressService";

import {
  createSubmission,
} from "../services/submissionService";

import { apiFetch } from "../services/api";

import problems from "../data/problems";
import { getEarnedXP } from "../utils/xpUtils";

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
  const [
    newAchievements,
    setNewAchievements,
  ] = useState([]);

  const [weeklySolved, setWeeklySolved] = useState(0);

  // XP — declared here (top of state block) so it's available throughout
  // the component. Value is server-authoritative: set on hydrate from API
  // response. Optimistic update in markProblemSolved is corrected by server.
  const [totalXP, setTotalXP] = useState(0);
  const [role, setRole] = useState("student");

  // --------------------------------------------------
  // HYDRATE FROM MONGODB
  // --------------------------------------------------

  useEffect(() => {
    if (!user) return;

    async function hydrate() {
      try {
        // Single boot call — replaces 3 sequential API calls:
        // initProgress() + getProgress() + getSubmissions()
        // One token refresh, one HTTP round-trip, parallel MongoDB queries.
        const {
          user: bootUser,
          progress,
          submissions: mongoSubmissions,
          _dbDown,
        } = await apiFetch("/api/init");
        console.log("Boot user:", bootUser);

        if (_dbDown) {
          console.warn("[AppContext] Database unavailable on boot — using empty defaults.");
        }
        console.log("Setting role:", bootUser?.role);

        setRole(bootUser?.role || "student");

        setSolvedProblems(
          progress.solvedSlugs || []
        );

        setTopicStats(
          progress.topicStats || {}
        );

        setActivityDates(
          progress.activityDates || []
        );

        const today = new Date();

        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);

        // Count problems solved this week by joining recentActivity (has per-solve dates)
        // recentActivity entries have a `time` field = "YYYY-MM-DD" of the solve.
        // This is more accurate than counting activityDates (which counts days, not solves).
        const recentActivityThisWeek = (progress.recentActivity || []).filter((entry) => {
          if (!entry.time) return false;
          return new Date(entry.time) >= weekStart;
        }).length;

        // Fallback: if recentActivity is empty or sparse, count unique solved slugs
        // whose first appearance is within the last 7 days (best approximation).
        // recentActivity is capped at 10 items, so for heavy users this underestimates.
        // TODO: add a server-side weeklyCount field for accuracy above 10.
        const solvedThisWeek = recentActivityThisWeek;

        setWeeklySolved(solvedThisWeek);

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

        setTotalXP(
          progress.totalXP || 0
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

    // Increment weekly count for every new problem solved (not just first of the day).
    // The guard above (solvedProblems.includes(slug)) already ensures this only
    // fires once per unique problem, so no double-counting.
    setWeeklySolved((prev) => prev + 1);

    // XP is now computed server-side. We compute a local optimistic update
    // for immediate UI feedback only — the server response will correct it.
    // Streak multiplier: 2x XP if streak >= 3 consecutive days
    // This rewards consistency and makes the streak counter feel meaningful.
    const baseXP = getEarnedXP(difficulty);
    const streakMultiplier = currentStreak >= 3 ? 2 : 1;
    const earnedXP = baseXP * streakMultiplier;
    const nextTotalXP =
      totalXP + earnedXP;



    const persistPayload = {
      solvedSlugs:
        nextSolvedProblems,

      topicStats:
        nextTopicStats,

      activityDates:
        nextActivityDates,

      solvedDifficulty:
        nextSolvedDifficulty,

      totalXP: nextTotalXP,

      recentActivity:
        nextRecentActivity,
    };



    // MongoDB

    try {
      const response =
        await persistSolvedToMongo(
          persistPayload,
          slug,
          difficulty
        );


      if (
        response?.newAchievements?.length
      ) {
        setNewAchievements(
          response.newAchievements
        );
      }

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

        setTotalXP(
          response.totalXP ??
          nextTotalXP
        );


      }


    } catch (err) {
      console.error(
        "[AppContext] Progress save failed:",
        err
      );
    }
  }

  // --------------------------------------------------
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
    weeklySolved,
    weeklyGoal: 10,
    submissions,
    role,
    totalXP,
    addSubmission,
    markProblemSolved,
    newAchievements,
    setNewAchievements,
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