import { useMemo } from "react";
import patterns from "../../data/patterns";
import PatternCard from "./PatternCard";

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