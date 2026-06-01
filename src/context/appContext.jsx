import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";
import { useAuth } from "./authContext";
import {
  getProgress,
  initProgress,
  markProblemSolved as persistSolvedToFirestore,
} from "../services/progressService";

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
      return saved ? JSON.parse(saved) : { Easy: 0, Medium: 0, Hard: 0 };
    } catch {
      return { Easy: 0, Medium: 0, Hard: 0 };
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
        await initProgress(user.uid);
        const fp = await getProgress(user.uid);

        // Merge solvedProblems: union of both sources
        setSolvedProblems((prev) =>
          Array.from(new Set([...prev, ...(fp.solvedProblems || [])]))
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
            Easy:   Math.max(prev.Easy   || 0, fd.Easy   || 0),
            Medium: Math.max(prev.Medium || 0, fd.Medium || 0),
            Hard:   Math.max(prev.Hard   || 0, fd.Hard   || 0),
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

  // ── Actions ──────────────────────────────────────────────────────────────

  // addSubmission: updates local state AND persists to Firestore.
  // FIX: previous version only wrote to localStorage/state.
  // Firestore write is non-blocking — local state updates instantly.
  // If Firestore fails, localStorage still has the submission.
  async function addSubmission(submission) {
    // 1. Instant local update (for SubmissionHistory component)
    setSubmissions((prev) => [submission, ...prev]);

    // 2. Persist to Firestore (non-blocking)
    if (user) {
      try {
        await addDoc(collection(db, "submissions"), {
          ...submission,
          userId: user.uid,
          // serverTimestamp() is more reliable than client Date for ordering
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        // Non-fatal: localStorage already has the submission.
        console.warn("[AppContext] Submission Firestore save failed:", err.message);
      }
    }
  }

  // markProblemSolved: updates local state + syncs to Firestore.
  async function markProblemSolved({ slug, difficulty }) {
    // Update local state (instant, de-duplicated)
    setSolvedProblems((prev) =>
      prev.includes(slug) ? prev : [...prev, slug]
    );

    const today = new Date().toISOString().split("T")[0];
    setActivityDates((prev) =>
      prev.includes(today) ? prev : [...prev, today]
    );

    // difficulty is "Easy" | "Medium" | "Hard" — capital first letter
    setSolvedDifficulty((prev) => ({
      ...prev,
      [difficulty]: (prev[difficulty] ?? 0) + 1,
    }));

    // Persist to Firestore in background
    if (user) {
      try {
        await persistSolvedToFirestore(user.uid, slug, difficulty);
      } catch (err) {
        console.warn("[AppContext] Progress Firestore sync failed:", err.message);
      }
    }
  }

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
