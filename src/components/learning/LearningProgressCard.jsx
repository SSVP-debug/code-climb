import { Link } from "react-router-dom";

function LearningProgressCard({
  solvedCount = 0,
  total = 0,
  progress = 0,
  solvedDifficulty = { easy: 0, medium: 0, hard: 0 },
  attemptedCount = 0,
}) {
  // Real breakdown — Attempted is the distinct-problemSlug count derived
  // from submission history (see ProblemsPage), Easy/Medium/Hard come
  // straight from the same solvedDifficulty the profile/analytics pages
  // already use (backend/controllers/progressController.js).
  const breakdown = [
    { label: "Solved",    count: solvedCount,               color: "bg-green-500"  },
    { label: "Attempted", count: attemptedCount,             color: "bg-blue-500"   },
    { label: "Easy",      count: solvedDifficulty.easy,      color: "bg-green-400"  },
    { label: "Medium",    count: solvedDifficulty.medium,    color: "bg-yellow-500" },
    { label: "Hard",      count: solvedDifficulty.hard,      color: "bg-red-500"    },
  ];

  // SVG donut ring params
  const radius = 36;
  const stroke = 7;
  const normalised = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalised;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Learning Progress
        </p>
        <Link
          to="/analytics"
          className="text-xs text-[var(--theme-primary,#2dd4bf)] hover:brightness-110 transition"
        >
          View analytics
        </Link>
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
              stroke="var(--surface-elevated)"
              strokeWidth={stroke}
            />
            {/* Progress arc */}
            <circle
              cx="40"
              cy="40"
              r={normalised}
              fill="none"
              stroke="var(--theme-primary, #2dd4bf)"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-base font-bold leading-none text-[var(--foreground)]">{progress}%</p>
            <p className="text-[9px] text-[var(--muted-foreground)] mt-0.5 leading-none">Overall</p>
            {total > 0 && (
              <p className="text-[8px] text-[var(--muted-foreground)] mt-1 leading-none">
                {solvedCount}/{total}
              </p>
            )}
          </div>
        </div>

        {/* Breakdown list */}
        <div className="flex flex-col gap-1.5 flex-1">
          {breakdown.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.color}`} />
                <p className="text-xs text-[var(--muted-foreground)]">{item.label}</p>
              </div>
              <p className="text-xs font-semibold text-[var(--foreground)]">{item.count}</p>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}

export default LearningProgressCard;