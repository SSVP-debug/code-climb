/**
 * xpUtils.js
 *
 * Frontend XP constants — must stay in sync with backend/utils/computeXP.js
 * Single source of truth for the client side.
 */

export const XP_BY_DIFFICULTY = {
  Easy:   10,
  Medium: 25,
  Hard:   50,
};

export function getEarnedXP(difficulty) {
  return XP_BY_DIFFICULTY[difficulty] ?? 0;
}