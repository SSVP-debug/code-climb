import { useTheme } from "../../../context/ThemeContext";
import ProblemCard from "../../ProblemCard";
import ProblemCardSkeleton from "./ProblemCardSkeleton";

const SKELETON_COUNT = 8;

function ProblemList({
  loading,
  filtered,
  setSelectedDifficulty,
  setSelectedTopic,
  setSearchTerm,
}) {
  const { theme } = useTheme();

  if (loading) {
    return (
      <div className="flex flex-col gap-3" aria-busy>
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <ProblemCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-500 text-lg">
          {theme.words.noProblemsFound}
        </p>
        <button
          onClick={() => {
            setSelectedDifficulty("All");
            setSelectedTopic("All");
            setSearchTerm("");
          }}
          className="mt-4 text-green-400 hover:underline text-sm"
        >
          {theme.words.clearFilters}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 animate-fadeIn" aria-busy={false}>
      {filtered.map((problem) => (
        <ProblemCard key={problem.id} problem={problem} />
      ))}
    </div>
  );
}

export default ProblemList;
