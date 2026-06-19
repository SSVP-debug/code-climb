import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getSubmissions,
  createSubmission,
} from "../services/submissionService";

import { useAuth } from "./authContext";
import {
  getProgress,
  initProgress,
  markProblemSolved as persistSolvedToFirestore,
} from "../services/progressService";
import problems from "../data/problems";



// Named export — required by useAppContext.js import
export const AppContext = createContext(null);

function AppContextProvider({ children }) {
  const { user } = useAuth();

  // ── State (localStorage as initial source) ──────────────────────────────
  const [solvedProblems, setSolvedProblems] = useState(() => {
    try {
      const saved = localStorage.getItem("solvedProblems");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activityDates, setActivityDates] = useState(() => {
    try {
      const saved = localStorage.getItem("activityDates");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Keys are "Easy" | "Medium" | "Hard" — matches problem.difficulty exactly.
  const [solvedDifficulty, setSolvedDifficulty] = useState(() => {
    try {
      const saved = localStorage.getItem("solvedDifficulty");
      return saved ? JSON.parse(saved) : { easy: 0, medium: 0, hard: 0 };
    } catch {
      return { easy: 0, medium: 0, hard: 0 };
    }
  });

  const [submissions, setSubmissions] = useState(() => {
    try {
      const saved = localStorage.getItem("submissions");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ── Derived state ────────────────────────────────────────────────────────
  // recentActivity: last 7 submissions as rich objects for Profile display.
  // FIX: was previously date strings — now { title, time, status, slug }.
  const recentActivity = useMemo(() => {
    return [...submissions]
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 7)
      .map((sub) => ({
        title: sub.problemTitle || sub.problemSlug || "Unknown Problem",
        time: sub.date || (sub.createdAt ? sub.createdAt.split("T")[0] : "Recently"),
        status: sub.status || "",
        slug: sub.problemSlug || "",
      }));
  }, [submissions]);

  // ── Firestore hydration ──────────────────────────────────────────────────
  // FIX: MERGE strategy — never overwrite with less data than localStorage has.
  //
  // Why merge, not replace:
  //   If a Firestore write failed silently (network, quota), Firestore has fewer
  //   items than localStorage. Replacing would silently lose the user's progress.
  //   Taking the union: if localStorage has ["a","b"] and Firestore has ["a"],
  //   result is ["a","b"] — no data is ever lost.
  //
  // Cross-device sync:
  //   If Firestore has ["a","b","c"] (solved on another device) and localStorage
  //   has ["a"], result is ["a","b","c"] — cross-device additions are picked up.
  useEffect(() => {
    if (!user) return;

    async function hydrateFromFirestore() {
      try {
        await initProgress();
        const fp = await getProgress();

        const firestoreSubmissions =
          await loadUserSubmissions(user.uid);

        setSubmissions((prev) => {
          if (prev.length > 0) return prev;

          return firestoreSubmissions;
        });

        // Merge solvedProblems: union of both sources
        setSolvedProblems((prev) =>
          Array.from(new Set([...prev, ...(fp.solvedSlugs || [])]))
        );

        // Merge activityDates: union, keep sorted
        setActivityDates((prev) =>
          Array.from(new Set([...prev, ...(fp.activityDates || [])]))
            .sort((a, b) => a.localeCompare(b))
        );

        // Merge difficulty counts: take the higher of each source
        setSolvedDifficulty((prev) => {
          const fd = fp.solvedDifficulty || {};
          return {
            easy: Math.max(prev.easy || 0, fd.easy || 0),
            medium: Math.max(prev.medium || 0, fd.medium || 0),
            hard: Math.max(prev.hard || 0, fd.hard || 0),
          };
        });
      } catch (err) {
        // Non-fatal: localStorage values stay active.
        console.warn(
          "[AppContext] Firestore hydration failed — using localStorage:",
          err.message
        );
      }
    }

    hydrateFromFirestore();
  }, [user]);

  // ── Persist to localStorage ──────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("solvedProblems", JSON.stringify(solvedProblems));
  }, [solvedProblems]);

  useEffect(() => {
    localStorage.setItem("activityDates", JSON.stringify(activityDates));
  }, [activityDates]);

  useEffect(() => {
    localStorage.setItem("solvedDifficulty", JSON.stringify(solvedDifficulty));
  }, [solvedDifficulty]);

  useEffect(() => {
    localStorage.setItem("submissions", JSON.stringify(submissions));
  }, [submissions]);

  async function loadUserSubmissions() {
    return getSubmissions();
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  // addSubmission: updates local state AND persists to Firestore.
  // FIX: previous version only wrote to localStorage/state.
  // Firestore write is non-blocking — local state updates instantly.
  // If Firestore fails, localStorage still has the submission.
  async function addSubmission(submission) {
    // Instant UI update
    setSubmissions((prev) => [submission, ...prev]);

    if (!user) return;

    try {
      console.log("🚀 Saving submission", submission);
      await createSubmission({
        problemSlug: submission.problemSlug,
        language: submission.language,
        code: submission.code || "// code not stored",
        status: submission.status,
        passed: submission.passed || 0,
        total: submission.total || 0,
        executionTime: submission.executionTime || null,
        output: submission.actualOutput || "",
      });

      console.log("✅ Submission saved to MongoDB");
    } catch (err) {
      console.warn(
        "[AppContext] Submission MongoDB save failed:",
        err.message
      );
    }
  }

  // markProblemSolved: updates local state + syncs to Firestore.
  async function markProblemSolved({ slug, difficulty }) {
    const today = new Date().toISOString().split("T")[0];

    const nextSolvedProblems = Array.from(new Set([...solvedProblems, slug]));

    const nextActivityDates = activityDates.includes(today)
      ? activityDates
      : [...activityDates, today];

    const difficultyKey = difficulty.toLowerCase();
    const nextSolvedDifficulty = {
      ...solvedDifficulty,
      [difficultyKey]: (solvedDifficulty[difficultyKey] ?? 0) + 1,
    };

    // ← FIX C: compute topicStats update
    const problemMeta = problems.find((p) => p.slug === slug);
    const topic = problemMeta?.topic || problemMeta?.pattern || null;
    const nextTopicStats = topic
      ? { ...topicStats, [topic]: (topicStats[topic] || 0) + 1 }
      : topicStats;

    // ← FIX D: build recentActivity entry
    const nextRecentActivity = [
      { title: problemMeta?.title || slug, slug, time: new Date().toISOString(), status: "Accepted" },
      ...recentActivity,
    ].slice(0, 10);

    // Instant UI update
    setSolvedProblems(nextSolvedProblems);
    setActivityDates(nextActivityDates);
    setSolvedDifficulty(nextSolvedDifficulty);
    setTopicStats(nextTopicStats);
    setRecentActivity(nextRecentActivity);

    if (user) {
      try {
        const result = await persistSolvedToFirestore(
          {
            solvedSlugs: nextSolvedProblems,
            activityDates: nextActivityDates,
            solvedDifficulty: nextSolvedDifficulty, // service will NOT re-increment
            topicStats: nextTopicStats,
            recentActivity: nextRecentActivity,
          },
          slug,
          difficulty
        );

        // ← FIX E: hydrate streak from server response
        if (result?.currentStreak !== undefined) setCurrentStreak(result.currentStreak);
        if (result?.longestStreak !== undefined) setLongestStreak(result.longestStreak);
        if (result?.lastActivityDate !== undefined) setLastActivityDate(result.lastActivityDate);

        console.log("✅ Progress saved to MongoDB", result);
      } catch (err) {
        console.error("FULL PROGRESS ERROR", err);
      }
    }
  }

  const totalXP = solvedProblems.reduce(
    (sum, slug) => {
      const p = problems.find(
        (x) => x.slug === slug
      );

      return sum + (p?.xp || 0);
    },
    0
  );

  // ── Context value ────────────────────────────────────────────────────────
  const value = {
    solvedProblems,
    activityDates,
    solvedDifficulty,
    submissions,
    recentActivity,
    addSubmission,
    markProblemSolved,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Single source of truth for useAppContext.
// useAppContext.js re-exports this.
export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      "[useAppContext] Must be used inside <AppContextProvider>. " +
      "Check provider order in main.jsx: AuthProvider must wrap AppContextProvider."
    );
  }

  return context;
}

export default AppContextProvider;
