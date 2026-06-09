export function getStatusLabel(theme, status) {
  if (!status) return status;

  if (status.includes("Accepted")) {
    return theme.words.accepted;
  }

  if (status.includes("Wrong Answer")) {
    return theme.words.wrongAnswer;
  }

  if (status.includes("Runtime")) {
    return theme.words.runtimeError;
  }

  if (status.includes("Compilation")) {
    return theme.words.compileError;
  }

  return status;
}