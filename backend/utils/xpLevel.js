const K = 12.44;
const GROWTH = 1.6;

/** Cumulative total XP required to REACH `level` (level 1 = 0 XP). */
export function getXPForLevel(level) {
  return Math.round(K * Math.pow(Math.max(0, level - 1), GROWTH));
}

/** Current level for a given total XP. */
export function getLevel(totalXP = 0) {
  const xp = Math.max(0, totalXP || 0);
  // Closed-form inverse gets us within ±1 of the right level; getXPForLevel
  // rounds independently, so nudge the candidate to guarantee the two
  // functions always agree (xp is always within [floor(level), floor(level+1))).
  let level = Math.max(1, Math.floor(1 + Math.pow(xp / K, 1 / GROWTH)));
  while (getXPForLevel(level + 1) <= xp) level++;
  while (level > 1 && getXPForLevel(level) > xp) level--;
  return level;
}

/** XP still needed to reach the next level. */
export function getXPForNextLevel(totalXP = 0) {
  const level = getLevel(totalXP);
  return getXPForLevel(level + 1) - Math.max(0, totalXP || 0);
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