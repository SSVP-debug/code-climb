function Analytics() {
  return <h1>Analytics</h1>;
}

export default Analytics;

export function getUserRank() {

  const solvedProblems =
    JSON.parse(
      localStorage.getItem(
        "codeclimbSolved"
      )
    ) || [];

  const solvedCount =
    solvedProblems.length;

  if (solvedCount < 5) {

    return "Beginner";

  }

  if (solvedCount < 15) {

    return "Learner";

  }

  if (solvedCount < 30) {

    return "Intermediate";

  }

  if (solvedCount < 60) {

    return "Advanced";

  }

  return "Expert";

}

export function getUserLevel() {

  const solvedProblems =
    JSON.parse(
      localStorage.getItem(
        "codeclimbSolved"
      )
    ) || [];

  return solvedProblems.length;

}