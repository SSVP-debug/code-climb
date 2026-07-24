import { useHideDifficultyLabels } from "../../../hooks/useHideDifficultyLabels";

const DIFFICULTY_STYLE = {
  Easy: "bg-green-500/10 text-green-400",
  Medium: "bg-yellow-500/10 text-yellow-400",
  Hard: "bg-red-500/10 text-red-400",
};

function DifficultyBadge({ difficulty }) {
  const hideDifficulty = useHideDifficultyLabels();
  if (hideDifficulty) return null;

  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_STYLE[difficulty] || "bg-zinc-700 text-zinc-300"}`}>
      {difficulty}
    </span>
  );
}

export default DifficultyBadge;