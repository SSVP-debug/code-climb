import Problem from "../models/Problem.js";

/**
 * Returns the "Next Best Problem" recommendation shown on the Submission
 * Experience after an Accepted solve.
 *
 * This is the ONLY function that should change when a real recommendation
 * engine (topic-gap analysis, spaced repetition, difficulty curve, etc.)
 * replaces today's placeholder — every caller depends only on this
 * function's `{ slug, title, difficulty, topic } | null` contract, never
 * on how the pick was made. Swap the implementation below; nothing in
 * problemController.js or the frontend needs to change.
 *
 * Today: falls back to the next problem in canonical `id` order — the same
 * ordering already used for prev/next problem navigation.
 *
 * @param {{ id: number }} problem — the just-solved problem
 * @returns {Promise<{slug: string, title: string, difficulty: string, topic: string|null} | null>}
 */
export async function getNextBestProblem(problem) {
  const next = await Problem.findOne({ id: { $gt: problem.id } })
    .select("slug title difficulty topic")
    .sort({ id: 1 })
    .lean();

  if (!next) return null;

  return {
    slug: next.slug,
    title: next.title,
    difficulty: next.difficulty,
    topic: next.topic ?? null,
  };
}
