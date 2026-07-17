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

import { apiFetch } from "../services/api";

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

  // Admin "Login As" state — sourced from /api/init's `impersonation`
  // block. { active: false } when not impersonating, or
  // { active: true, adminEmail, targetEmail, targetDisplayName, targetRole }
  // while an admin is viewing as someone else. `role` above already
  // reflects the target during impersonation (by design); this is purely
  // for the banner + Exit action.
  const [impersonation, setImpersonation] = useState({ active: false });

  // /api/init's progress payload has always included joinedDate (see
  // backend/controllers/progressController.js), but it was never captured
  // here — Profile.jsx was reading user?.createdAt off the raw Firebase
  // Auth object instead, which has no such field, so it always fell back
  // to "Recently". Real fix: hydrate the real value from Mongo.
  const [joinedDate, setJoinedDate] = useState(null);

  // Phase 9C — editable via updateRecruiterSnapshot below, hydrated from
  // /api/init's bootUser (not progressToClient — this is account data,
  // not progress data, same distinction as joinedDate vs XP/streaks).
  const [recruiterSnapshot, setRecruiterSnapshot] = useState({
    availableForWork: false,
    preferredRole: null,
    expectedGraduation: null,
  });

  // Phase 9E — consolidated here instead of SettingsPage's own fetch
  // (single source of truth; also needed by ProfileCompletion).
  const [username, setUsername] = useState("");
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [leetcodeStats, setLeetcodeStats] = useState(null);

  // Phase 9D — [{ slug, title, difficulty }], denormalized at pin time.
  const [pinnedProblems, setPinnedProblems] = useState([]);

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
          impersonation: bootImpersonation,
          _dbDown,
        } = await apiFetch("/api/init");

        if (_dbDown) {
          console.warn("[AppContext] Database unavailable on boot — using empty defaults.");
        }

        setRole(bootUser?.role || "student");
        setImpersonation(bootImpersonation || { active: false });

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

        setJoinedDate(
          progress.joinedDate || null
        );

        if (bootUser?.recruiterSnapshot) {
          setRecruiterSnapshot({
            availableForWork: bootUser.recruiterSnapshot.availableForWork ?? false,
            preferredRole: bootUser.recruiterSnapshot.preferredRole ?? null,
            expectedGraduation: bootUser.recruiterSnapshot.expectedGraduation ?? null,
          });
        }

        setPinnedProblems(bootUser?.pinnedProblems || []);

        setUsername(bootUser?.username || "");
        setLeetcodeUsername(bootUser?.leetcodeUsername || "");
        setLeetcodeStats(bootUser?.leetcodeStats || null);


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

  // NOTE: this used to also POST the submission to the backend
  // (`createSubmission`) so it would persist to Mongo. That endpoint was a
  // security hole — it accepted client-supplied `status`/`passed`/`total`
  // and saved them as-is, meaning any authenticated user could fabricate an
  // "Accepted" submission without ever running their code (see
  // docs/security-fixes/2026-07-solve-integrity.md).
  //
  // The backend now records every submission itself, server-side, inside
  // POST /api/judge/submit — from the actual Judge0-graded result, not
  // from whatever the client claims afterward. By the time judgeSubmission()
  // (src/services/judgeService.js) resolves, the Submission row already
  // exists. So this function's only remaining job is the optimistic local
  // UI update — there's nothing left to persist here. A full history
  // (including this entry) is available via getSubmissions() / GET
  // /api/submissions on next fetch.
  function addSubmission(submission) {
    setSubmissions((prev) => [
      submission,
      ...prev,
    ]);
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
    // Optimistic UI update.
    // Server remains the source of truth for XP.
    const earnedXP = getEarnedXP(difficulty);

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
  // RECRUITER SNAPSHOT (Phase 9C)
  // --------------------------------------------------

  async function updateRecruiterSnapshot(patch) {
    const result = await apiFetch("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify({ recruiterSnapshot: patch }),
    });
    setRecruiterSnapshot({
      availableForWork: result.recruiterSnapshot?.availableForWork ?? false,
      preferredRole: result.recruiterSnapshot?.preferredRole ?? null,
      expectedGraduation: result.recruiterSnapshot?.expectedGraduation ?? null,
    });
    return result.recruiterSnapshot;
  }

  // --------------------------------------------------
  // PINNED PROBLEMS (Phase 9D)
  // --------------------------------------------------

  async function pinProblem(slug) {
    const result = await apiFetch("/api/users/me/pinned-problems", {
      method: "POST",
      body: JSON.stringify({ slug }),
    });
    setPinnedProblems(result.pinnedProblems || []);
    return result.pinnedProblems;
  }

  async function unpinProblem(slug) {
    const result = await apiFetch(`/api/users/me/pinned-problems/${slug}`, {
      method: "DELETE",
    });
    setPinnedProblems(result.pinnedProblems || []);
    return result.pinnedProblems;
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
    impersonation,
    totalXP,
    joinedDate,
    recruiterSnapshot,
    updateRecruiterSnapshot,
    pinnedProblems,
    pinProblem,
    unpinProblem,
    username,
    setUsername,
    leetcodeUsername,
    setLeetcodeUsername,
    leetcodeStats,
    setLeetcodeStats,
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