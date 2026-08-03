/**
 * dailyQuizStorage.js
 *
 * Client-only "once per day" gate for the Daily Quick Quiz (see
 * src/utils/quizEngine.js / src/data/quizQuestions.js). No quiz attempt is
 * persisted server-side (Plan 001 design decision), and the result itself
 * is only ever shown once, right when the quiz finishes (see
 * DailyQuickQuiz's per-question review) — it isn't reopenable later, so
 * this only needs to remember the date the quiz was last completed, not
 * the result itself.
 *
 * Uses the same date-key convention as appContext.jsx's streak calculation
 * (ISO "YYYY-MM-DD", local calendar day via toISOString) and the existing
 * getStorageData/setStorageData wrapper (src/services/storageService.js)
 * rather than raw localStorage calls.
 */

import { getStorageData, setStorageData } from "../services/storageService";

const LAST_COMPLETED_KEY = "codeclubDailyQuizLastCompleted";

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

/** Has the Daily Quick Quiz already been completed today? */
export function hasCompletedQuizToday() {
  return getStorageData(LAST_COMPLETED_KEY, null) === todayKey();
}

/** Marks today's Daily Quick Quiz as completed. */
export function markQuizCompletedToday() {
  setStorageData(LAST_COMPLETED_KEY, todayKey());
}