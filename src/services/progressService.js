import {
  arrayUnion,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const DEFAULT_PROGRESS = {
  solvedProblems: [],
  activityDates: [],
  solvedDifficulty: { Easy: 0, Medium: 0, Hard: 0 },
};

function getTodayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Returns user's progress from Firestore, or defaults if no document exists.
export async function getProgress(userId) {
  if (!userId) throw new Error("[progressService] userId required");

  try {
    const snap = await getDoc(doc(db, "progress", userId));

    if (!snap.exists()) return { ...DEFAULT_PROGRESS };

    return {
      ...DEFAULT_PROGRESS,
      ...snap.data(),
    };
  } catch (err) {
    console.error("[progressService] getProgress failed:", err.message);
    return { ...DEFAULT_PROGRESS };
  }
}

// Creates a blank progress document for first-time users.
// Safe to call on every login — only writes if the document doesn't exist.
export async function initProgress(userId) {
  if (!userId) throw new Error("[progressService] userId required");

  const ref = doc(db, "progress", userId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      ...DEFAULT_PROGRESS,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
    });
  }
}

// Atomically marks a problem as solved in Firestore.
//
// difficulty must be "Easy" | "Medium" | "Hard" (capitalized) — matching
// problem.difficulty and appContext's solvedDifficulty keys.
export async function markProblemSolved(userId, problemSlug, difficulty) {
  if (!userId || !problemSlug || !difficulty) {
    throw new Error(
      "[progressService] markProblemSolved requires userId, problemSlug, difficulty"
    );
  }

  const validDifficulties = ["Easy", "Medium", "Hard"];
  if (!validDifficulties.includes(difficulty)) {
    throw new Error(
      `[progressService] Invalid difficulty: "${difficulty}". Must be one of: ${validDifficulties.join(", ")}`
    );
  }

  await setDoc(
    doc(db, "progress", userId),
    {
      solvedProblems: arrayUnion(problemSlug),
      activityDates: arrayUnion(getTodayString()),
      // e.g. "solvedDifficulty.Easy": increment(1)
      [`solvedDifficulty.${difficulty}`]: increment(1),
      lastActive: serverTimestamp(),
    },
    { merge: true }  // create or update without overwriting other fields
  );
}
