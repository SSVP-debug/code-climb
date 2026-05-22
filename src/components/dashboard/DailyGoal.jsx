

function DailyGoal({ dailySolved }) {

  return (
    <div className="mt-10 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">

      <div className="flex items-center justify-between mb-4">

        <h2 className="text-2xl font-semibold">
          Daily Goal
        </h2>

        <p className="text-green-400 font-semibold">
          {dailySolved} / 5 Completed
        </p>

      </div>

      <div className="w-full bg-zinc-800 rounded-full h-4 overflow-hidden">

        <div
          className="bg-green-500 h-full transition-all"
          style={{
            width: `${Math.min(
              (dailySolved / 5) * 100,
              100
            )}%`,
          }}
        ></div>

      </div>

      <p className="text-zinc-400 mt-4">
        Complete 5 problems today to maintain momentum.
      </p>

    </div>
  );
}

export default DailyGoal;