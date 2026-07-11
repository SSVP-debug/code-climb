import PatternGrid from "../../patterns/PatternGrid";

function PatternView({ problems, topicStats, setSelectedTopic, setActiveView }) {
  function handleSelectPattern(topic) {
    setSelectedTopic(topic);
    setActiveView("browse");
  }

  return (
    <div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 mb-6">
        <h2 className="text-2xl font-bold">Learn by Pattern</h2>
        <p className="text-zinc-400 mt-2 text-sm">
          Master one concept at a time. Pick a pattern to jump straight to its problems.
        </p>
      </div>

      <PatternGrid
        problems={problems}
        topicStats={topicStats}
        onSelectPattern={handleSelectPattern}
      />
    </div>
  );
}

export default PatternView;