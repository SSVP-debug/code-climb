import { useMemo } from "react";
import patterns from "../../data/patterns";
import PatternCard from "./PatternCard";

// AUDIT NOTE — orphan, needs a product decision, not a code fix.
// This component (and its sole dependent, PatternCard.jsx) is never
// imported anywhere in the app — verified via repo-wide grep. The
// "patterns" tab actually shown on /problems today uses a *different*
// component, PatternView.jsx, which is a broader, currently-live
// implementation: it ranks all ~21 real topic categories by completion
// with a "Focus Areas" callout. This file instead maps a small *curated*
// taxonomy of 10 named algorithm patterns (see src/data/patterns.js) onto
// topics — a different, narrower framing that PatternView doesn't cover.
// Left in place rather than deleted since it's unclear whether this was
// superseded by PatternView (safe to remove) or is a distinct feature
// that was scaffolded but never wired into a tab/route (migration
// incomplete). Recommend: product call on whether "Learn by Pattern
// (curated)" should become its own view/tab, before either deleting this
// or building the missing entry point.
//
// Joins the curated pattern taxonomy (src/data/patterns.js) to problems via
// the `topic` field — the same controlled-vocabulary field already used
// for topic filtering/stats everywhere else in the app. Most pattern
// names match their topic string exactly; the ones that don't are listed
// explicitly here rather than relying on fuzzy/case-insensitive matching.
//
// Coverage note: this taxonomy intentionally covers 10 foundational
// patterns, not the full ~21-topic catalog (Backtracking, Bit
// Manipulation, Design, Greedy, Hashing, Heap, Intervals, Math, Matrix,
// Strings, and Trie have no pattern card). That's a deliberate "core
// fundamentals" framing for this page — every topic remains reachable via
// the regular topic filter on the Browse tab either way.
const PATTERN_TOPIC_MAP = {
  "hash-map": "Hash Maps",
  stack: "Stacks",
};

function topicFor(pattern) {
  return PATTERN_TOPIC_MAP[pattern.id] || pattern.name;
}

function PatternGrid({ problems, topicStats, onSelectPattern }) {
  const rows = useMemo(() => {
    return patterns.map((pattern) => {
      const topic = topicFor(pattern);
      const total = problems.filter((p) => p.topic === topic).length;
      const solved = Math.min(total, topicStats?.[topic] || 0);
      return { pattern, topic, total, solved };
    });
  }, [problems, topicStats]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {rows.map(({ pattern, topic, total, solved }) => (
        <PatternCard
          key={pattern.id}
          pattern={pattern}
          solved={solved}
          total={total}
          onClick={() => onSelectPattern(topic)}
        />
      ))}
    </div>
  );
}

export default PatternGrid;