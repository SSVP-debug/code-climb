import { apiFetch } from "./api";

/**
 * Saves the one-click "how difficult did this feel?" rating for an
 * Accepted submission. Storage-only today — see backend/models/Reflection.js.
 */
export async function saveReflection(submissionId, difficultyRating) {
  return apiFetch("/api/reflections", {
    method: "POST",
    body: JSON.stringify({ submissionId, difficultyRating }),
  });
}
