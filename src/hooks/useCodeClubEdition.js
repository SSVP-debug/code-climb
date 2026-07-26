/**
 * useCodeClubEdition.js
 *
 * Single seam between Code Club Edition UI and its data. Wraps a static
 * import of src/data/codeClubEdition.js today; if the campaign map ever
 * moves to a backend model (e.g. for the future community-submission
 * pipeline), only this file changes — no consuming component does. Same
 * pattern, same rationale, as useLearningPaths.js.
 *
 * For each chapter this resolves mission slugs against the already-fetched
 * `problems` list (joined in curated order — a mission slug missing from
 * the current catalog is dropped, not crashed, with a dev-only warning,
 * exactly like useLearningPaths), computes per-mission lock status,
 * per-chapter progress, and whether the chapter itself is unlocked. It
 * also derives the campaign-wide summary (`campaignProgress`) used by the
 * hero banner and "Continue Adventure".
 */
import { useMemo } from "react";
import rawChapters from "../data/codeClubEdition";
import {
  computeMissionStatuses,
  buildChapterProgress,
  isChapterUnlocked,
  buildCampaignProgress,
} from "../utils/codeClubEditionProgress";

export function useCodeClubEdition(problems, solvedProblems) {
  return useMemo(() => {
    // Pass 1: resolve missions -> problems, compute progress. Chapter
    // unlock (pass 2) needs every chapter's progress available up front,
    // since a chapter's unlock depends on a DIFFERENT chapter's progress.
    const withProgress = rawChapters.map((chapter) => {
      const resolvedMissions = chapter.missions
        .map((mission) => {
          const problem = problems.find((p) => p.slug === mission.slug);
          return problem ? { ...mission, ...problem } : null;
        })
        .filter(Boolean);

      if (
        problems.length > 0 &&
        resolvedMissions.length !== chapter.missions.length
      ) {
        console.warn(
          `[useCodeClubEdition] Chapter "${chapter.id}" references ${
            chapter.missions.length - resolvedMissions.length
          } mission slug(s) not found in the current problem catalog — they were skipped.`
        );
      }

      const missionStatuses = computeMissionStatuses(resolvedMissions, solvedProblems);
      const progress = buildChapterProgress(resolvedMissions, solvedProblems);

      return { ...chapter, missions: resolvedMissions, missionStatuses, progress };
    });

    const progressByChapterId = new Map(withProgress.map((c) => [c.id, c.progress]));

    // Pass 2: unlock state, now that every chapter's progress is known.
    const chapters = withProgress.map((chapter) => ({
      ...chapter,
      unlocked: isChapterUnlocked(chapter, progressByChapterId),
    }));

    const campaignProgress = buildCampaignProgress(chapters);

    return { chapters, campaignProgress };
  }, [problems, solvedProblems]);
}