import { useMemo } from "react";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { rankTopicsByCompletion } from "../../utils/rankTopics";

const FOCUS_COUNT = 3;
function PatternView({ problems, topicStats, setSelectedTopic, setActiveView }) {
  const topicRows = useMemo(
    () => rankTopicsByCompletion(problems, topicStats),
    [problems, topicStats]
  );

  function goToTopic(topic) {
    setSelectedTopic(topic);
    setActiveView("browse");
  }

  if (topicRows.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold">Learn by Pattern</h2>
        <p className="text-zinc-400 mt-2 text-sm">
          Problems are still loading — check back in a moment.
        </p>
      </div>
    );
  }

  // Only surface "Focus Areas" for topics that aren't already fully solved —
  // a student who's cleared everything shouldn't see a scary red callout.
  const focusAreas = topicRows.filter((row) => row.pct < 100).slice(0, FOCUS_COUNT);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">Learn by Pattern</h2>
        <p className="text-zinc-400 mt-1 text-sm">
          Master one topic at a time — ranked by where you have the most room to grow.
        </p>
      </div>

      {focusAreas.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-amber-400" />
            <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
              Focus Areas
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {focusAreas.map((row) => (
              <button
                key={row.topic}
                onClick={() => goToTopic(row.topic)}
                className="flex items-center justify-between gap-3 w-full text-left rounded-xl px-3 py-2.5 bg-zinc-950/40 hover:bg-zinc-900 transition"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{row.topic}</p>
                  <p className="text-xs text-zinc-500">
                    {row.solved}/{row.total} solved · {row.pct}%
                  </p>
                </div>
                <ChevronRight size={16} className="text-zinc-600 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">
          All Topics
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {topicRows.map((row) => (
            <button
              key={row.topic}
              onClick={() => goToTopic(row.topic)}
              className="text-left rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 hover:border-zinc-600 transition group"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-white group-hover:text-green-400 transition">
                  {row.topic}
                </p>
                <span className="text-xs text-zinc-500 whitespace-nowrap">
                  {row.solved}/{row.total}
                </span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    row.pct === 100 ? "bg-green-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${row.pct}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PatternView;