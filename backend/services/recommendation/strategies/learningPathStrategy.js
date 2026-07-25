import Problem from "../../../models/Problem.js";
import { findLearningPathById } from "../../../data/learningPathOrder.js";

/**
 * learningPathStrategy — Priority 1.
 *
 * "If the user is currently inside a Learning Path, recommend the next
 * unlocked problem in that path."
 *
 * Same locking rule as the frontend's utils/learningPathProgress.js
 * (computeProblemStatuses): the "next unlocked" problem is the first
 * slug in curated path order that isn't in solvedSlugs. Deliberately
 * reimplemented here (rather than imported) since it's a 3-line rule and
 * the frontend util lives in a package this backend can't import from —
 * see backend/data/learningPathOrder.js for the fuller explanation.
 *
 * Returns null (falls through to the next strategy) when:
 *   - no pathId was given (user wasn't solving inside a path), or
 *   - the pathId doesn't match any known path, or
 *   - every problem in the path is already solved (path complete —
 *     Priority 2's next-unsolved strategy takes over instead of dead-ending
 *     the user just because their current path ran out).
 *
 * @param {{ pathId: string|null, solvedSlugs: string[] }} context
 * @returns {Promise<{slug: string, title: string, difficulty: string, topic: string|null, reason: string} | null>}
 */
export async function learningPathStrategy({ pathId, solvedSlugs }) {
  const path = findLearningPathById(pathId);
  if (!path) return null;

  const solvedSet = new Set(solvedSlugs);
  const nextSlug = path.problemSlugs.find((slug) => !solvedSet.has(slug));
  if (!nextSlug) return null; // path complete — let the next strategy handle it

  const next = await Problem.findOne({ slug: nextSlug })
    .select("slug title difficulty topic")
    .lean();

  // Slug is in the curated path but missing from the live catalog
  // (renamed/removed problem) — don't recommend a dead link, fall through
  // instead. Matches useLearningPaths.js's own handling of this case.
  if (!next) return null;

  return {
    slug: next.slug,
    title: next.title,
    difficulty: next.difficulty,
    topic: next.topic ?? null,
    reason: `Next challenge in your ${path.name} path.`,
  };
}