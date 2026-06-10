export function canChangeTheme({
  solvedCount,
  selectedAt,
}) {
  if (!selectedAt) {
    return true;
  }

  const selectedDate = new Date(selectedAt);

  const daysPassed =
    (Date.now() - selectedDate.getTime()) /
    (1000 * 60 * 60 * 24);

  return (
    solvedCount >= 10 ||
    daysPassed >= 30
  );
}

export function getThemeUnlockProgress({
  solvedCount,
  selectedAt,
}) {
  if (!selectedAt) {
    return {
      problemsRemaining: 0,
      daysRemaining: 0,
    };
  }

  const selectedDate = new Date(selectedAt);

  const daysPassed =
    (Date.now() - selectedDate.getTime()) /
    (1000 * 60 * 60 * 24);

  return {
    problemsRemaining: Math.max(
      0,
      10 - solvedCount
    ),

    daysRemaining: Math.max(
      0,
      Math.ceil(30 - daysPassed)
    ),
  };
}