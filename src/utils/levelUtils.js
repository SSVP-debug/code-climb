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
  return totalXP % 100;
}