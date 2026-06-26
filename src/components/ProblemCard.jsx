import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

function ProblemCard({ problem }) {
  const { theme } = useTheme();

  const {
    title,
    difficulty,
    topic,
    slug,
    solved = false,
    saved = false,
    pattern,
    estimatedTime,
    learningLabel,
  } = problem;


  const difficultyColors = {
    Easy: "bg-green-500/15 text-green-400 border-green-500/20",
    Medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    Hard: "bg-red-500/15 text-red-400 border-red-500/20",
  };

  return (
    <Link
      to={`/problems/${slug}`}
      className={`
        group
        flex
        items-center
        justify-between
        gap-4
        px-5
        py-3
        rounded-xl
        border
        transition-all
        duration-200
        ${solved
          ? "bg-zinc-900/60 border-zinc-800 opacity-75"
          : "bg-zinc-900 border-zinc-800 hover:border-green-500 hover:bg-zinc-800/70"
        }
      `}
    >
      {/* Left */}
      <div className="flex items-center gap-4 min-w-0 flex-1">

        {/* Solved indicator */}
        <div
          className={`w-3 h-3 rounded-full flex-shrink-0 ${solved ? "bg-green-500" : "bg-zinc-600"
            }`}
        />

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">

            <h2 className="text-[15px] font-semibold text-white">
              {title}
            </h2>

            {(pattern || topic) && (
              <>
                <span className="text-zinc-600">•</span>

                <span className="text-sm text-zinc-400">
                  {pattern || topic}
                </span>
              </>
            )}

          </div>

          {learningLabel && (
            <p className="text-xs text-blue-400 mt-1">
              {learningLabel}
            </p>
          )}
        </div>

      </div>

      {/* Right */}
      <div className="flex items-center gap-3 flex-shrink-0">

        {estimatedTime && (
          <span className="text-xs text-zinc-400 whitespace-nowrap">
            ⏱ {estimatedTime}
          </span>
        )}

        <span
          className={`px-3 py-1 rounded-full border text-xs font-semibold ${difficultyColors[difficulty] ?? "bg-zinc-700 text-zinc-300 border-zinc-600"
            }`}
        >
          {difficulty
            ? theme.words[difficulty.toLowerCase()] ?? difficulty
            : "Unknown"}
        </span>

        <button
          onClick={(e) => e.preventDefault()}
          className={`text-lg transition ${saved
            ? "text-yellow-400"
            : "text-zinc-500 hover:text-yellow-400"
            }`}
          title="Save problem"
        >
          {saved ? "★" : "☆"}
        </button>

      </div>
    </Link>
  );
}

export default ProblemCard;