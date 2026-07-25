/**
 * learningPathProgress.js
 *
 * Pure derivation of a Learning Path's per-problem lock state and overall
 * progress from (ordered problems, solved slugs). No side effects, no
 * React — kept separate from useLearningPaths so the locking rule itself
 * is unit-testable in isolation (see learningPathProgress.test.js).
 *
 * Locking rule: a problem is "current" (unlocked, not yet solved) only if
 * it's the first not-yet-solved problem in sequence order. Everything
 * after the current one is locked. Already-solved problems are always
 * shown as solved regardless of position — a student who solved problem
 * #4 via Browse before ever opening this path should see it checked off,
 * not re-locked, and the "current" marker naturally advances to the next
 * unsolved problem the next time this is computed.
 */

export const STATUS = Object.freeze({
  SOLVED: "solved",
  CURRENT: "current", // unlocked, not yet solved — the "you are here" problem
  LOCKED: "locked",
});

/**
 * @param {Array<{slug: string}>} orderedProblems
 * @param {string[]} solvedSlugs
 * @returns {Array<{slug: string, status: string}>} status per problem, same order as input
 */
export function computeProblemStatuses(orderedProblems, solvedSlugs) {
  const solvedSet = new Set(solvedSlugs);
  let currentAssigned = false;

  return orderedProblems.map((problem) => {
    if (solvedSet.has(problem.slug)) {
      return { slug: problem.slug, status: STATUS.SOLVED };
    }
    if (!currentAssigned) {
      currentAssigned = true;
      return { slug: problem.slug, status: STATUS.CURRENT };
    }
    return { slug: problem.slug, status: STATUS.LOCKED };
  });
}

/**
 * @param {Array<{slug: string}>} orderedProblems
 * @param {string[]} solvedSlugs
 * @returns {{ solvedCount: number, total: number, percent: number, isComplete: boolean, isStarted: boolean }}
 */
export function buildPathProgress(orderedProblems, solvedSlugs) {
  const total = orderedProblems.length;
  const solvedSet = new Set(solvedSlugs);
  const solvedCount = orderedProblems.filter((p) => solvedSet.has(p.slug)).length;

  // Guard divide-by-zero for a misconfigured (empty) path rather than
  // showing NaN% — an empty path is a content bug, not a reason to crash.
  const percent = total > 0 ? Math.round((solvedCount / total) * 100) : 0;

  return {
    solvedCount,
    total,
    percent,
    isComplete: total > 0 && solvedCount === total,
    isStarted: solvedCount > 0,
  };
}
