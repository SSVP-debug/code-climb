function DifficultyBreakdown({ solvedDifficulty }) {
  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-4">Difficulty Breakdown</h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400">Easy</p>
          <p className="text-2xl font-bold">{solvedDifficulty?.easy || 0}</p>
        </div>
        <div className="bg-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400">Medium</p>
          <p className="text-2xl font-bold">{solvedDifficulty?.medium || 0}</p>
        </div>
        <div className="bg-zinc-800 rounded-xl p-4">
          <p className="text-zinc-400">Hard</p>
          <p className="text-2xl font-bold">{solvedDifficulty?.hard || 0}</p>
        </div>
      </div>
    </div>
  );
}

export default DifficultyBreakdown;
