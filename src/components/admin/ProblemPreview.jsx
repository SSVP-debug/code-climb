import ProblemHeader from "../problem/ProblemHeader";
import ProblemInfo from "../problem/ProblemInfo";

/**
 * ProblemPreview — plan 006's "preview" requirement, satisfied by reusing
 * the actual student-facing renderer rather than building a second
 * Markdown/code-block implementation.
 *
 * Deliberately uses ProblemInfo's non-"full" variant: the "full" variant
 * pulls in the Interview Mode CTA, HintSystem, EditorialPanel (which does
 * its own fetch by slug — would 404 harmlessly for an unsaved draft, but
 * is pointless here), and RelatedProblems — none of which make sense for
 * an admin reviewing a draft's content before saving. This still reuses
 * every bit of the actual description/example/constraint/company
 * rendering, which is the part that matters for "does this look right."
 *
 * ProblemHeader/ProblemInfo both read from PremiumContext/AppContext via
 * hooks (usePremium, useHideDifficultyLabels) — both already wrap the
 * whole app at the root (see src/main.jsx), so no extra provider wiring
 * is needed here; the admin console is inside that same tree.
 */
export default function ProblemPreview({ problem }) {
  if (!problem) return null;

  return (
    <div className="max-w-3xl">
      <ProblemHeader problem={problem} isSolved={false} />
      <ProblemInfo problem={problem} variant="compact" />
    </div>
  );
}