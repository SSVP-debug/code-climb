export function breakDownMs(ms) {
  const clamped = Math.max(ms, 0);
  const totalSeconds = Math.floor(clamped / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

/** Time remaining until targetDate — raw ms, an isEnded flag, and the breakdown. */
export function getTimeRemaining(targetDate) {
  const ms = new Date(targetDate).getTime() - Date.now();
  return { ms, isEnded: ms <= 0, ...breakDownMs(ms) };
}