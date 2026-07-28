/**
 * @deprecated — audit fix, frontend audit implementation session.
 *
 * This file's getLevel() used a flat `floor(xp/100)+1` formula that
 * disagreed with xpLevel.js's curve (the one Profile.jsx, PublicProfile.jsx,
 * ProfileShareCard.jsx, and the backend all use). Its last two consumers
 * (RankProgressSection.jsx, LevelUpModal.jsx) were switched to xpLevel.js
 * in this session, so nothing in the app imports this file anymore
 * (verified via repo-wide grep). Left in place rather than deleted, since
 * removal wasn't explicitly requested — safe to delete in a follow-up
 * once that's confirmed once more against the live branch.
 */
export function getLevel(totalXP = 0) {
  return Math.floor(totalXP / 100) + 1;
}

export function getXPForNextLevel(
  totalXP = 0
) {
  return 100 - (totalXP % 100);
}

export function getLevelProgress(
  totalXP = 0
) {
  const xp = Math.max(0, totalXP || 0);
  const current = xp % 100;
  const needed = 100;
  return {
    current,
    needed,
    percent: Math.round((current / needed) * 100),
  };
}