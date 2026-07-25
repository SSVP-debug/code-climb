import { getRecommendation } from "../services/recommendation/RecommendationService.js";

/**
 * Returns the "Next Best Problem" recommendation shown on the Submission
 * Experience after an Accepted solve.
 *
 * This is the stable entry point (the "Provider") that problemController.js
 * calls — the actual decision logic lives in
 * services/recommendation/RecommendationService.js and its strategies.
 * Keeping this thin wrapper around it means every caller depends only on
 * the `{ slug, title, difficulty, topic, reason } | null` contract, never
 * on how the pick was made or where the strategies live.
 *
 * @param {{ id: number, slug: string }} problem — the just-solved/viewed problem
 * @param {{ solvedSlugs?: string[], pathId?: string|null }} [options]
 * @returns {Promise<{slug: string, title: string, difficulty: string, topic: string|null, reason: string} | null>}
 */
export async function getNextBestProblem(problem, { solvedSlugs = [], pathId = null } = {}) {
  return getRecommendation({ problem, solvedSlugs, pathId });
}