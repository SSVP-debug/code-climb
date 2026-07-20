function TopicBreakdownCard({ topicStats, strongestTopic }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h2 className="text-xl font-semibold mb-4">Topic Breakdown</h2>

      {Object.keys(topicStats).length === 0 ? (
        <p className="text-zinc-400">No topic data yet.</p>
      ) : (
        <div className="space-y-3">
          {Object.entries(topicStats).map(([topic, count]) => (
            <div
              key={topic}
              className="flex items-center justify-between bg-zinc-800 px-4 py-3 rounded-xl"
            >
              <span>{topic}</span>
              <span className="text-green-400 font-semibold">{count}</span>
            </div>
          ))}
        </div>
      )}

      {strongestTopic && (
        <p className="text-zinc-400 text-sm mt-4">
          Strongest Topic: <span className="text-white">{strongestTopic}</span>
        </p>
      )}
    </div>
  );
}

export default TopicBreakdownCard;
