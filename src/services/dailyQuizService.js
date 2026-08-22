import { apiFetch } from "./api";

/**
 * GET /api/daily-quiz/status — { required, completed }. Called by
 * DailyQuizGuard on mount / whenever the authenticated user changes.
 * Server is the source of truth; see backend/controllers/dailyQuizController.js.
 */
export async function getDailyQuizStatus() {
  return apiFetch("/api/daily-quiz/status");
}

/**
 * POST /api/daily-quiz/complete — persists today's completion before
 * DailyQuizGuard unlocks the app. Idempotent on the backend, safe to
 * retry.
 */
export async function completeDailyQuiz() {
  return apiFetch("/api/daily-quiz/complete", { method: "POST" });
}
