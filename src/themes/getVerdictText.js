export function getVerdictText(theme, verdict) {
  const map = {
    accepted: theme.words.accepted,
    wrongAnswer: theme.words.wrongAnswer,
    runtimeError: theme.words.runtimeError,
    compileError: theme.words.compileError,
  };

  return map[verdict] ?? verdict;
}