/**
 * xpLevel.js
 *
 * Frontend mirror of backend/utils/xpLevel.js — must stay in sync (same
 * K/GROWTH constants). Same pattern as xpUtils.js: XP itself is always
 * server-authoritative, but once totalXP is hydrated into AppContext,
 * deriving "what level is that" is a pure function safe to run on the
 * client rather than round-tripping to the server.
 */

const K = 12.44;
const GROWTH = 1.6;

/** Cumulative total XP required to REACH `level` (level 1 = 0 XP). */
export function getXPForLevel(level) {
  return Math.round(K * Math.pow(Math.max(0, level - 1), GROWTH));
}

/** Current level for a given total XP. */
export function getLevel(totalXP = 0) {
  const xp = Math.max(0, totalXP || 0);
  let level = Math.max(1, Math.floor(1 + Math.pow(xp / K, 1 / GROWTH)));
  while (getXPForLevel(level + 1) <= xp) level++;
  while (level > 1 && getXPForLevel(level) > xp) level--;
  return level;
}

/** Progress into the current level, as a { current, needed, percent } breakdown. */
export function getLevelProgress(totalXP = 0) {
  const xp = Math.max(0, totalXP || 0);
  const level = getLevel(xp);
  const floor = getXPForLevel(level);
  const ceil = getXPForLevel(level + 1);
  const span = ceil - floor;
  return {
    current: xp - floor,
    needed: span,
    percent: span > 0 ? Math.round(((xp - floor) / span) * 100) : 100,
  };
}