/**
 * rankTopicsByCompletion
 *
 * Groups the problem catalog by `problem.topic` and ranks each topic by
 * solved / total using topicStats (solved-count-per-topic, tracked in
 * AppContext — see context/appContext.jsx). Weakest topics (lowest %)
 * come first.
 *
 * This is intentionally the ONLY place this ranking is computed — both
 * PatternView (Learn by Pattern view) and AICoachCard (Problems page right
 * rail) import this instead of each having their own copy. Keeping it in
 * one place is the same reasoning as the XP curve consolidation: two
 * near-identical implementations of "what counts as weak" would drift.
 */
export function rankTopicsByCompletion(problems, topicStats = {}) {
  const totals = new Map();

  for (const problem of problems) {
    if (!problem.topic) continue;
    totals.set(problem.topic, (totals.get(problem.topic) || 0) + 1);
  }

  return [...totals.entries()]
    .map(([topic, total]) => {
      const solved = Math.min(topicStats[topic] || 0, total);
      const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
      return { topic, total, solved, pct };
    })
    .sort((a, b) => a.pct - b.pct || b.total - a.total);
}