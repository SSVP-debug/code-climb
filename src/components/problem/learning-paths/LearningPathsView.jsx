import { useEffect, useState } from "react";
import { useLearningPaths } from "../../../hooks/useLearningPaths";
import LearningPathCard from "./LearningPathCard";
import LearningPathDetail from "./LearningPathDetail";

// Mirrors ProblemsPage.jsx's cc_activeView sessionStorage pattern exactly.
// This matters more than it looks like it does: opening a bundled problem
// navigates to the separate /problems/:slug route, which unmounts
// ProblemsPage (and this view) entirely. Without persisting which path
// was open, a student who solves a problem and comes back would land on
// the path *list*, not the path they were working through — undoing the
// whole point of the feature. See plans/001-learning-paths.md §3.
function readStoredPathId() {
  try {
    return sessionStorage.getItem("cc_learningPathId") || null;
  } catch {
    return null;
  }
}

function LearningPathsView({ problems, solvedProblems }) {
  const paths = useLearningPaths(problems, solvedProblems);
  const [selectedPathId, setSelectedPathId] = useState(readStoredPathId);

  useEffect(() => {
    try {
      if (selectedPathId) {
        sessionStorage.setItem("cc_learningPathId", selectedPathId);
      } else {
        sessionStorage.removeItem("cc_learningPathId");
      }
    } catch {
      /* sessionStorage unavailable (private mode, etc.) — non-fatal,
         selection just won't survive a route change */
    }
  }, [selectedPathId]);

  const selectedPath = paths.find((p) => p.id === selectedPathId) ?? null;

  if (selectedPath) {
    const isFirstPathToComplete = !paths.some(
      (p) => p.id !== selectedPath.id && p.progress.isComplete
    );

    return (
      <LearningPathDetail
        path={selectedPath}
        solvedProblems={solvedProblems}
        isFirstPathToComplete={isFirstPathToComplete}
        onBack={() => setSelectedPathId(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)]">Learning Paths</h2>
        <p className="text-[var(--muted-foreground)] mt-1 text-sm">
          A guided roadmap to solve problems in order, one unlocks the next.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {paths.map((path) => (
          <LearningPathCard key={path.id} path={path} onOpen={setSelectedPathId} />
        ))}
      </div>
    </div>
  );
}

export default LearningPathsView;
