/**
 * LearningProgressCard
 *
 * Circular progress ring + difficulty breakdown.
 * TODO: wire up easy/medium/hard counts from user progress API.
 *
 * Props:
 *   solvedCount — total problems solved
 *   total       — total problems available
 *   progress    — 0-100 percentage
 */
function LearningProgressCard({ solvedCount = 0, total = 0, progress = 0 }) {
  // Placeholder breakdown — replace with real data from user progress.
  const breakdown = [
    { label: "Solved",    count: solvedCount, color: "bg-green-500"  },
    { label: "Attempted", count: 0,           color: "bg-blue-500"   },
    { label: "Easy",      count: 0,           color: "bg-green-400"  },
    { label: "Medium",    count: 0,           color: "bg-yellow-500" },
    { label: "Hard",      count: 0,           color: "bg-red-500"    },
  ];

  // SVG donut ring params
  const radius = 36;
  const stroke = 7;
  const normalised = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalised;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Learning Progress
        </p>
        <button className="text-xs text-green-400 hover:text-green-300 transition">
          View analytics
        </button>
      </div>

      <div className="flex items-center gap-4">

        {/* Donut ring */}
        <div className="relative flex-shrink-0 w-20 h-20">
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            className="-rotate-90"
          >
            {/* Track */}
            <circle
              cx="40"
              cy="40"
              r={normalised}
              fill="none"
              stroke="#27272a"
              strokeWidth={stroke}
            />
            {/* Progress arc */}
            <circle
              cx="40"
              cy="40"
              r={normalised}
              fill="none"
              stroke="#22c55e"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-base font-bold leading-none">{progress}%</p>
            <p className="text-[9px] text-zinc-500 mt-0.5 leading-none">Overall</p>
          </div>
        </div>

        {/* Breakdown list */}
        <div className="flex flex-col gap-1.5 flex-1">
          {breakdown.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.color}`} />
                <p className="text-xs text-zinc-400">{item.label}</p>
              </div>
              <p className="text-xs font-semibold text-zinc-300">{item.count}</p>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}

export default LearningProgressCard;
