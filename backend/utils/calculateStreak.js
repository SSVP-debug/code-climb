export function calculateStreak(activityDates = []) {
  if (!activityDates.length) {
    return {
      currentStreak: 0,
      longestStreak: 0,
    };
  }

  const sorted = [...new Set(activityDates)]
    .sort();

  let longestStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);

    const diffDays =
      (curr - prev) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentRun++;
      longestStreak = Math.max(
        longestStreak,
        currentRun
      );
    } else {
      currentRun = 1;
    }
  }

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const yesterday = new Date(
    Date.now() - 86400000
  )
    .toISOString()
    .split("T")[0];

  const lastDate =
    sorted[sorted.length - 1];

  let currentStreak = 0;

  if (
    lastDate === today ||
    lastDate === yesterday
  ) {
    currentStreak = 1;

    for (
      let i = sorted.length - 1;
      i > 0;
      i--
    ) {
      const curr = new Date(sorted[i]);
      const prev = new Date(sorted[i - 1]);

      const diffDays =
        (curr - prev) /
        (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    longestStreak,
  };
}