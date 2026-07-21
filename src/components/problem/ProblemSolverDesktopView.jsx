/**
 * ProblemSolverDesktopView — the `lg`-and-above resizable split layout
 * (problem description | editor + results) for a problem's detail page.
 *
 * Extracted from src/pages/ProblemDetailsPage.jsx (Staff review §4/§9/#12).
 * Purely presentational — all state/handlers come from useProblemSolver via
 * props. The two mouse-drag resize handles are kept inline exactly as they
 * were (they're small, self-contained, and only used here).
 */
import ErrorBanner from "../ErrorBanner";
import ErrorBoundary from "../ErrorBoundary";
import SubmissionResultBanner from "../workspace/SubmissionResultBanner";
import ProblemHeader from "./ProblemHeader";
import ProblemInfo from "./ProblemInfo";
import ProblemEditor from "./ProblemEditor";
import WorkspacePanel from "./WorkspacePanel";

function ProblemSolverDesktopView({ problem, slug, solver }) {
  const {
    isSolved,
    editorHeight,
    setEditorHeight,
    problemWidth,
    setProblemWidth,
    language,
    code,
    setCode,
    customInput,
    setCustomInput,
    running,
    submitting,
    error,
    runResults,
    submitInfo,
    forceTab,
    handleLanguageChange,
    handleResetCode,
    handleRunCode,
    handleSubmitCode,
  } = solver;

  return (
    <div className="hidden lg:flex h-full overflow-hidden bg-zinc-950">
      <div className="h-full w-full overflow-hidden px-3 py-2">
        <div className="flex h-full overflow-hidden relative gap-3">
          {/* Left column — Problem description */}
          <div className="h-full overflow-hidden" style={{ width: `${problemWidth}%` }}>
            <div className="h-full overflow-y-auto custom-scrollbar bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
              <ProblemHeader problem={problem} isSolved={isSolved} />
              <ProblemInfo problem={problem} />
            </div>
          </div>

          {/* Resize handle (horizontal — problem/editor split) */}
          <div
            className="w-1 mx-2 cursor-col-resize bg-zinc-800/40 rounded-full hover:bg-[var(--theme-primary,#2dd4bf)] transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = problemWidth;
              const handleMove = (moveEvent) => {
                const delta = ((moveEvent.clientX - startX) / window.innerWidth) * 100;
                setProblemWidth(Math.min(45, Math.max(20, startWidth + delta)));
              };
              const handleUp = () => {
                window.removeEventListener("mousemove", handleMove);
                window.removeEventListener("mouseup", handleUp);
              };
              window.addEventListener("mousemove", handleMove);
              window.addEventListener("mouseup", handleUp);
            }}
          />

          {/* Right column — Editor + Workspace */}
          <div className="h-full flex flex-col overflow-hidden" style={{ width: `${100 - problemWidth}%` }}>
            {error && (
              <div className="flex-shrink-0 pb-2">
                <ErrorBanner message={error} />
              </div>
            )}

            <div className="flex-shrink-0 pb-2" style={{ height: `${editorHeight}px` }}>
              <ErrorBoundary
                fallback={
                  <div className="h-full bg-zinc-900 border border-red-500 text-red-400 p-6 rounded-2xl">
                    Editor failed to load.
                  </div>
                }
              >
                <ProblemEditor
                  slug={slug}
                  language={language}
                  setLanguage={handleLanguageChange}
                  code={code}
                  setCode={setCode}
                  customInput={customInput}
                  setCustomInput={setCustomInput}
                  onRun={handleRunCode}
                  onSubmit={handleSubmitCode}
                  onReset={handleResetCode}
                  running={running}
                  submitting={submitting}
                />
              </ErrorBoundary>
            </div>

            {/* Resize handle (vertical — editor/results split) */}
            <div
              className="w-full h-2 cursor-row-resize rounded-full bg-zinc-800/40 hover:bg-[var(--theme-primary,#2dd4bf)] transition-colors mb-2"
              onMouseDown={(e) => {
                e.preventDefault();
                const startY = e.clientY;
                const startHeight = editorHeight;
                const handleMove = (moveEvent) => {
                  const delta = moveEvent.clientY - startY;
                  setEditorHeight(Math.min(600, Math.max(200, startHeight + delta)));
                };
                const handleUp = () => {
                  window.removeEventListener("mousemove", handleMove);
                  window.removeEventListener("mouseup", handleUp);
                };
                window.addEventListener("mousemove", handleMove);
                window.addEventListener("mouseup", handleUp);
              }}
            />

            <div className="flex-1 min-h-0 flex flex-col">
              <SubmissionResultBanner submitInfo={submitInfo} />
              <div className="flex-1 min-h-0 overflow-hidden bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
                <WorkspacePanel
                  runResults={runResults}
                  submitInfo={submitInfo}
                  isRunning={running}
                  isSubmitting={submitting}
                  forceTab={forceTab}
                  problem={problem}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProblemSolverDesktopView;