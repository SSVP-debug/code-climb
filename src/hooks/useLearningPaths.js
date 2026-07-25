/**
 * useLearningPaths.js
 *
 * Single seam between Learning Path UI and Learning Path data. Today this
 * wraps a static import (src/data/learningPaths.js); if paths ever move to
 * a backend model (e.g. so TPOs can curate their own), only this file
 * changes — no consuming component needs to change. See
 * plans/001-learning-paths.md §4 for the full rationale.
 *
 * Enriches each path with resolved problem objects (joined against the
 * already-fetched `problems` list by slug, in curated order) and derived
 * progress, so no consumer component re-implements the join or the
 * locking logic itself.
 */
import { useMemo } from "react";
import rawPaths from "../data/learningPaths";
import { buildPathProgress } from "../utils/learningPathProgress";

export function useLearningPaths(problems, solvedProblems) {
  return useMemo(() => {
    return rawPaths.map((path) => {
      // Resolve slugs → full problem objects, in curated order. A slug
      // that no longer exists in the current problem catalog (renamed or
      // removed problem) is dropped rather than crashing the page — warn
      // once so it surfaces in dev without breaking prod.
      const resolvedProblems = path.problemSlugs
        .map((slug) => problems.find((p) => p.slug === slug))
        .filter(Boolean);

      if (
        problems.length > 0 &&
        resolvedProblems.length !== path.problemSlugs.length
      ) {
        console.warn(
          `[useLearningPaths] Path "${path.id}" references ${
            path.problemSlugs.length - resolvedProblems.length
          } slug(s) not found in the current problem catalog — they were skipped.`
        );
      }

      return {
        ...path,
        problems: resolvedProblems,
        progress: buildPathProgress(resolvedProblems, solvedProblems),
      };
    });
  }, [problems, solvedProblems]);
}
