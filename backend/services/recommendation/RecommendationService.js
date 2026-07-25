import { learningPathStrategy } from "./strategies/learningPathStrategy.js";
import { nextUnsolvedStrategy } from "./strategies/nextUnsolvedStrategy.js";

/**
 * RecommendationService — "Next Best Problem" v1.
 *
 * Deterministic, no ML/AI/analytics (by design — see the product spec).
 * A simple chain-of-responsibility over ordered strategies: each strategy
 * either returns a recommendation or null (defer to the next one). The
 * first non-null result wins.
 *
 *   1. learningPathStrategy  — next unlocked problem in the user's
 *                              current Learning Path (if any)
 *   2. nextUnsolvedStrategy  — next unsolved problem in canonical order
 *
 * If every strategy returns null, there's genuinely nothing left to
 * recommend — the caller (getNextBestProblem) resolves that to `null`,
 * which the UI renders as a completion/celebration state, never a blank
 * section.
 *
 * ── Why this shape ──────────────────────────────────────────────────────
 * Every strategy has the identical signature
 *   (context) => Promise<Recommendation | null>
 * and the identical `Recommendation` output contract:
 *   { slug, title, difficulty, topic, reason }
 * Callers (problemController.js, and everything downstream of it — the
 * useProblem hook, NextBestProblemCard) only ever depend on that shape,
 * never on which strategy produced it. That's the seam a future,
 * smarter recommender plugs into: add a new strategy file with the same
 * signature, add it to STRATEGIES (in priority order, or replace one),
 * done — no changes needed in the controller, the hook, or any UI.
 *
 * Future signals the spec calls out (Reflection Score, weak/strong
 * topics, time since last practice, contest history, difficulty
 * preference, completion rate, daily goals, AI Coach) each become their
 * own strategy, reading whatever extra context they need out of the same
 * `context` object — extend RecommendationContext below, not each
 * strategy's call site.
 *
 * @typedef {Object} RecommendationContext
 * @property {{id: number, slug: string}} problem - the just-solved/viewed problem
 * @property {string[]} solvedSlugs - the current user's solved problem slugs
 * @property {string|null} pathId - the Learning Path the user is currently
 *   solving inside, if any (from the `?path=` query param — see
 *   ProblemDetailsPage.jsx). Null for Browse-view / direct-link visits.
 *
 * @typedef {Object} Recommendation
 * @property {string} slug
 * @property {string} title
 * @property {string} difficulty
 * @property {string|null} topic
 * @property {string} reason - always truthful, always sourced from the
 *   strategy that produced the pick — never invented at render time.
 */
const STRATEGIES = [learningPathStrategy, nextUnsolvedStrategy];

/**
 * @param {RecommendationContext} context
 * @returns {Promise<Recommendation | null>}
 */
export async function getRecommendation(context) {
  for (const strategy of STRATEGIES) {
    const recommendation = await strategy(context);
    if (recommendation) return recommendation;
  }
  return null;
}