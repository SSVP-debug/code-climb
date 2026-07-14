// Global (not per-slug) — there's only ever one "most recent" problem across
// the whole app, unlike code/language which are saved per-problem in
// utils/editorStorage.js.
const LAST_VISITED_KEY = "last-visited-problem-slug";

export function saveLastVisitedProblem(slug) {
  if (!slug) return;
  localStorage.setItem(LAST_VISITED_KEY, slug);
}

export function getLastVisitedProblem() {
  return localStorage.getItem(LAST_VISITED_KEY);
}