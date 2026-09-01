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
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_STYLE[difficulty] || "bg-[var(--surface-elevated)] text-[var(--muted-foreground)]"}`}>
      {difficulty}
    </span>
  );
}

export default DifficultyBadge;