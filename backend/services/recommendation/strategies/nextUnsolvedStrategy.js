import Problem from "../../../models/Problem.js";

/**
 * nextUnsolvedStrategy — Priority 2.
 *
 * "Otherwise recommend the next unsolved problem ... based on the default
 * problem ordering."
 *
 * Default ordering = canonical `id` ascending, same ordering already used
 * for prev/next problem navigation (see problemController.js).
 *
 * Looks forward from the just-solved problem first (the common case: a
 * student working roughly in order), then wraps around to the start of
 * the catalog if nothing unsolved remains ahead — otherwise a student who
 * solved problems out of order (e.g. jumped to #50, now sitting on #3
 * still unsolved) would be told "you're done" while #3 sits unsolved.
 * That's a real correctness gap in the placeholder this replaces: it only
 * ever looked at `id > current.id` and never checked solved state at all.
 *
 * @param {{ problem: {id: number}, solvedSlugs: string[] }} context
 * @returns {Promise<{slug: string, title: string, difficulty: string, topic: string|null, reason: string} | null>}
 */
export async function nextUnsolvedStrategy({ problem, solvedSlugs }) {
  const excludeSolved = { slug: { $nin: solvedSlugs } };
  // Fest Readiness Audit, P0-2: this walks the FULL catalog by canonical
  // id order — without this, a "contest" visibility problem could get
  // recommended to any random user (via ordinary next-problem navigation)
  // whenever its id happened to fall next in sequence, entirely outside
  // any contest context.
  const excludeContestOnly = { visibility: { $ne: "contest" } };

  const ahead = await Problem.findOne({
    id: { $gt: problem.id },
    ...excludeSolved,
    ...excludeContestOnly,
  })
    .select("slug title difficulty topic")
    .sort({ id: 1 })
    .lean();

  const next =
    ahead ??
    (await Problem.findOne({
      id: { $ne: problem.id },
      ...excludeSolved,
      ...excludeContestOnly,
    })
      .select("slug title difficulty topic")
      .sort({ id: 1 })
      .lean());

  if (!next) return null;

  return {
    slug: next.slug,
    title: next.title,
    difficulty: next.difficulty,
    topic: next.topic ?? null,
    reason: ahead
      ? "Keep your momentum going."
      : "Build on what you just practiced.",
  };
}