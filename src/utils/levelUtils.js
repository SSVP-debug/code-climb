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