import { formatDate } from "./formatters";

// Dynamic import: this file is imported from several places that don't
// necessarily need the full ~7000-line problems catalog just sitting in
// their bundle chunk (AvatarDropdown, which renders on most authenticated
// pages via Navbar/DashboardLayout, being the main one). Deferring the
// import here means the catalog only loads when a daily challenge is
// actually requested, not wherever this module happens to be imported.
export async function getDailyChallenge() {
  const { default: problems } = await import("../data/problems");

  const today = formatDate(new Date());

  const seed = today
    .split("/")
    .join("");

  const index =
    Number(seed) %
    problems.length;

  return problems[index];
}