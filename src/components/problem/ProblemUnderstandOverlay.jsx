/**
 * ProblemUnderstandOverlay — Stage 1 ("understand") of the workspace.
 *
 * A centered floating card containing only the problem itself: title,
 * difficulty, tags/topic, estimated time, companies, description, examples,
 * constraints. No editor, no run/submit, no testcases — reading is the
 * only available action.
 *
 * The blurred backdrop click and the "Start Coding" button both call the
 * same `onProceed` — leaving this stage always means arriving at Build,
 * there's no separate "closed but idle" state (see useWorkspaceStage.js).
 *
 * Hints/Editorial/Related problems are deliberately left out here (see
 * ProblemInfo's `variant="reading"`) — they're not gone, they're still in
 * the ordinary info panel/tab the student lands on once this card
 * dismisses, exactly as they always were.
 */
import ProblemHeader from "./ProblemHeader";
import ProblemInfo from "./ProblemInfo";
import Button from "../ui/Button";

function ProblemUnderstandOverlay({ problem, isSolved, hideDifficulty, onProceed }) {
  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center p-4 sm:p-8 bg-black/50"
      onClick={onProceed}
    >
      <div
        className="relative w-full max-w-2xl max-h-full overflow-y-auto custom-scrollbar bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 animate-understand-card-in"
        onClick={(e) => e.stopPropagation()}
      >
        <ProblemHeader problem={problem} isSolved={isSolved} hideDifficulty={hideDifficulty} />
        <ProblemInfo problem={problem} variant="reading" />

        <Button onClick={onProceed} className="mt-6 w-full">
          Start Coding →
        </Button>
      </div>
    </div>
  );
}

export default ProblemUnderstandOverlay;