/**
 * codeClubEditionProgress.js
 *
 * Pure derivation of Code Club Edition's lock/progress state. No side
 * effects, no React — same split as learningPathProgress.js, for the same
 * reason: the rules are unit-testable in isolation.
 *
 * Two layers of sequencing:
 *   1. Within a chapter, missions unlock sequentially — this is the exact
 *      same rule as Learning Paths, so it's reused directly from
 *      learningPathProgress.js rather than re-implemented.
 *   2. Across chapters, a chapter unlocks once its prerequisite chapter
 *      (per codeClubEdition.js's `unlockRequirement`) is fully solved.
 *      Chapter 1 (`unlockRequirement: null`) is always unlocked.
 *      `comingSoon` chapters are never unlocked regardless of progress —
 *      there's no content to unlock into yet.
 */
import { computeProblemStatuses, buildPathProgress, STATUS } from "./learningPathProgress";

export { STATUS };

/** @see computeProblemStatuses — identical rule, re-exported under this module's naming. */
export const computeMissionStatuses = computeProblemStatuses;

/** @see buildPathProgress — identical rule, re-exported under this module's naming. */
export const buildChapterProgress = buildPathProgress;

/**
 * @param {object} chapter - raw chapter from codeClubEdition.js
 * @param {Map<string, {isComplete: boolean}>} progressByChapterId
 * @returns {boolean}
 */
export function isChapterUnlocked(chapter, progressByChapterId) {
  if (chapter.comingSoon) return false;
  if (!chapter.unlockRequirement) return true;
  const prereqProgress = progressByChapterId.get(chapter.unlockRequirement.chapterId);
  return Boolean(prereqProgress?.isComplete);
}

/**
 * Aggregates chapter-level progress into a campaign-wide summary and
 * figures out where "Continue Adventure" should send the student.
 *
 * @param {Array<object>} enrichedChapters - chapters already enriched with
 *   `.progress` (buildChapterProgress output), `.unlocked` (boolean), and
 *   `.missionStatuses` (computeMissionStatuses output) by the caller
 *   (see useCodeClubEdition.js) — kept here as plain input rather than
 *   recomputed, so this function stays a simple aggregation step.
 * @returns {{
 *   totalMissions: number, solvedMissions: number, percent: number,
 *   isComplete: boolean,
 *   currentChapterId: string|null,
 *   continueTarget: {chapterId: string, slug: string}|null
 * }}
 */
export function buildCampaignProgress(enrichedChapters) {
  const released = enrichedChapters.filter((c) => !c.comingSoon);

  const totalMissions = released.reduce((sum, c) => sum + c.progress.total, 0);
  const solvedMissions = released.reduce((sum, c) => sum + c.progress.solvedCount, 0);
  const percent = totalMissions > 0 ? Math.round((solvedMissions / totalMissions) * 100) : 0;

  // First unlocked, not-yet-complete chapter drives "Continue Adventure" —
  // its first CURRENT mission is the actual target. A chapter with zero
  // missions (shouldn't happen for a released chapter, but guarded) is
  // skipped rather than crashing the campaign hero.
  let currentChapterId = null;
  let continueTarget = null;

  for (const chapter of released) {
    if (!chapter.unlocked || chapter.progress.isComplete) continue;
    currentChapterId = chapter.id;
    const nextMission = chapter.missionStatuses.find((m) => m.status === STATUS.CURRENT);
    if (nextMission) {
      continueTarget = { chapterId: chapter.id, slug: nextMission.slug };
    }
    break;
  }

  // Every unlocked chapter finished (or nothing unlocked has missions yet)
  // — still point "current chapter" somewhere sensible for display so the
  // hero never renders blank.
  if (!currentChapterId) {
    const fallback = released.find((c) => c.unlocked) ?? released[0] ?? null;
    currentChapterId = fallback?.id ?? null;
  }

  return {
    totalMissions,
    solvedMissions,
    percent,
    isComplete: totalMissions > 0 && solvedMissions === totalMissions,
    currentChapterId,
    continueTarget,
  };
}