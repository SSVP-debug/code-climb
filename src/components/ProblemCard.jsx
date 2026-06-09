import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

function ProblemCard({
  title,
  difficulty,
  topic,
  slug,
}) {
  const { theme } = useTheme();
  const difficultyColors = {
    Easy: "text-green-400",
    Medium: "text-yellow-400",
    Hard: "text-red-400",
  };
  const difficultyLabels = {
    Easy: theme.words.easy,
    Medium: theme.words.medium,
    Hard: theme.words.hard,
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-green-500 transition">

      <div className="flex items-center justify-between">

        <h2 className="text-2xl font-semibold">
          {title}
        </h2>

        <span
          className={`font-semibold ${difficultyColors[difficulty]
            }`}
        >
          {difficultyLabels[difficulty] ?? difficulty}
        </span>

      </div>

      <p className="text-zinc-400 mt-4">
        {theme.words.topic}: {topic}
      </p>

      <Link
        to={`/problems/${slug}`}
        className="inline-block mt-6 bg-green-500 hover:bg-green-600 transition px-5 py-3 rounded-xl font-semibold text-black"
      >
        {theme.words.solveProblem}
      </Link>

    </div>
  );
}

export default ProblemCard;