import problems from "../data/problems";
import { formatDate } from "./formatters";

export function getDailyChallenge() {
  const today = formatDate(new Date());

  const seed = today
    .split("/")
    .join("");

  const index =
    Number(seed) %
    problems.length;

  return problems[index];
}