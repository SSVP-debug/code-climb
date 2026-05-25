export function isProblemSolved(
  slug
) {

  const solvedProblems =
    JSON.parse(
      localStorage.getItem(
        "codeclimbSolved"
      )
    ) || [];

  return solvedProblems.includes(
    slug
  );
}