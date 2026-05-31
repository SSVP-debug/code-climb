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
  markProblemSolved as persistSolvedToFirestore,
} from "../services/progressService";

// ── Context ────────────────────────────────────────────────────────────────
// Named export — this is what useAppContext.js was trying to import.
export const AppContext = createContext(null);

// ── Provider ───────────────────────────────────────────────────────────────
function AppContextProvider({ children }) {
  const { user } = useAuth();

  // ── State (localStorage as initial source) ────────────────────────────
  const [solvedProblems, setSolvedProblems] = useState(() => {
    const saved = localStorage.getItem("solvedProblems");
    return saved ? JSON.parse(saved) : [];
  });

  const [activityDates, setActivityDates] = useState(() => {
    const saved = localStorage.getItem("activityDates");
    return saved ? JSON.parse(saved) : [];
  });

  // Keys are capitalized: Easy / Medium / Hard
  // This matches problem.difficulty ("Easy", "Medium", "Hard") exactly.
  const [solvedDifficulty, setSolvedDifficulty] = useState(() => {
    const saved = localStorage.getItem("solvedDifficulty");
    return saved
      ? JSON.parse(saved)
      : { Easy: 0, Medium: 0, Hard: 0 };
  });

  const [submissions, setSubmissions] = useState(() => {
    const saved = localStorage.getItem("submissions");
    return saved ? JSON.parse(saved) : [];
  });

  // ── Derived state ─────────────────────────────────────────────────────
  // recentActivity: last 7 active dates, newest first.
  // Previously missing from context — useDashboardData was getting undefined.
  const recentActivity = useMemo(
    () =>
      [...activityDates]
        .sort((a, b) => b.localeCompare(a))
        .slice(0, 7),
    [activityDates]
  );

  // ── Firestore hydration ───────────────────────────────────────────────
  // When user logs in, pull their real progress from Firestore and replace
  // the localStorage snapshot. Falls back silently if Firestore is offline.
  useEffect(() => {
    if (!user) return;

    async function hydrateFromFirestore() {
      try {
        // Creates a blank progress doc if this is the user's first login.
        await initProgress(user.uid);

        const progress = await getProgress(user.uid);

        setSolvedProblems(progress.solvedProblems ?? []);
        setActivityDates(progress.activityDates ?? []);

        // Merge Firestore keys with defaults in case older accounts
        // are missing newer difficulty keys.
        setSolvedDifficulty({
          Easy: 0,
          Medium: 0,
          Hard: 0,
          ...progress.solvedDifficulty,
        });
      } catch (err) {
        // Non-fatal: localStorage values loaded by useState stay active.
        console.warn(
          "[AppContext] Firestore hydration failed — using localStorage:",
          err.message
        );
      }
    }

    hydrateFromFirestore();
  }, [user]);

  // ── Persist to localStorage ───────────────────────────────────────────
  // These run after every state update so localStorage stays in sync.
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

  // ── Actions ───────────────────────────────────────────────────────────

  // addSubmission: no longer async — setSubmissions is synchronous.
  function addSubmission(submission) {
    setSubmissions((prev) => [submission, ...prev]);
  }

  // markProblemSolved: updates local state first (instant UI), then persists
  // to Firestore in the background. If Firestore fails, local state is safe.
  async function markProblemSolved({ slug, difficulty }) {
    // Guard: only count each problem once per session.
    setSolvedProblems((prev) =>
      prev.includes(slug) ? prev : [...prev, slug]
    );

    const today = new Date().toISOString().split("T")[0];
    setActivityDates((prev) =>
      prev.includes(today) ? prev : [...prev, today]
    );

    // difficulty is "Easy" | "Medium" | "Hard" — must match state keys exactly.
    setSolvedDifficulty((prev) => ({
      ...prev,
      [difficulty]: (prev[difficulty] ?? 0) + 1,
    }));

    // Sync to Firestore in background (non-blocking).
    if (user) {
      try {
        await persistSolvedToFirestore(user.uid, slug, difficulty);
      } catch (err) {
        // Local state already updated — the user won't notice.
        console.warn("[AppContext] Firestore sync failed:", err.message);
      }
    }
  }

  // ── Context value ─────────────────────────────────────────────────────
  const value = {
    solvedProblems,
    activityDates,
    solvedDifficulty,
    submissions,
    recentActivity,      // was missing — now added
    addSubmission,
    markProblemSolved,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// ── useAppContext hook ─────────────────────────────────────────────────────
// Exported here as the single source of truth.
// useAppContext.js now just re-exports this — no duplicate logic.
export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      "[useAppContext] Must be used inside <AppContextProvider>. " +
      "Check your provider order in main.jsx."
    );
  }

  return context;
}

export default AppContextProvider;