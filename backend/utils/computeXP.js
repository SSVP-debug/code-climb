/**
 * computeXP.js
 *
 * Single source of truth for XP values.
 * Used by the backfill migration and can be imported anywhere
 * that needs to recompute a user's total from their solvedSlugs.
 */
import { logger } from "../config/logger.js";

export const XP_BY_DIFFICULTY = {
  Easy:   10,
  Medium: 25,
  Hard:   50,
};

/**
 * Build a slug → difficulty lookup from the problems array.
 * Call once and reuse the map across many users.
 *
 * @param {Array} problems  — the full problems array from problems.js
 * @returns {Map<string, string>}  slug → "Easy" | "Medium" | "Hard"
 */
export function buildDifficultyMap(problems) {
  const map = new Map();
  for (const p of problems) {
    if (p.slug && p.difficulty) {
      map.set(p.slug, p.difficulty);
    }
  }
  return map;
}

/**
 * Compute total XP for a set of solved slugs.
 *
 * @param {string[]} solvedSlugs
 * @param {Map<string, string>} difficultyMap  — from buildDifficultyMap()
 * @param {{ warnUnknown?: boolean }} options
 * @returns {number}
 */
export function computeXPFromSlugs(solvedSlugs, difficultyMap, { warnUnknown = false } = {}) {
  let total = 0;

  for (const slug of solvedSlugs) {
    const difficulty = difficultyMap.get(slug);

    if (!difficulty) {
      if (warnUnknown) {
        logger.warn(`[computeXP] Unknown slug "${slug}" — contributing 0 XP`);
      }
      continue;
    }

    total += XP_BY_DIFFICULTY[difficulty] ?? 0;
  }

  return total;
}