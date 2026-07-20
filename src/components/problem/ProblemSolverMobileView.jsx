/**
 * ProblemSolverMobileView — the below-`lg` tabbed layout (Problem / Code /
 * Results) for a problem's detail page.
 *
 * Extracted from src/pages/ProblemDetailsPage.jsx (Staff review §4/§9/#12).
 * Purely presentational — all state/handlers come from useProblemSolver via
 * props; this component owns no state of its own beyond what MobileTabBar
 * needs to render.
 */
import ErrorBanner from "../ErrorBanner";
import ErrorBoundary from "../ErrorBoundary";
import SubmissionResultBanner from "../workspace/SubmissionResultBanner";
import ProblemHeader from "./ProblemHeader";
import ProblemInfo from "./ProblemInfo";
import ProblemEditor from "./ProblemEditor";
import WorkspacePanel from "./WorkspacePanel";
import Button from "../ui/Button";
import MobileTabBar from "./MobileTabBar";

function ProblemSolverMobileView({ problem, slug, solver }) {
  const {
    isSolved,
    timerFormatted,
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
    mobileTab,
    setMobileTab,
    forceTab,
    hasResults,
    handleLanguageChange,
    handleResetCode,
    handleRunCode,
    handleSubmitCode,
  } = solver;

  return (
    <div className="flex flex-col lg:hidden h-full overflow-hidden">
      <MobileTabBar active={mobileTab} onChange={setMobileTab} hasResults={hasResults} />

      <div className="flex-1 min-h-0 overflow-y-auto bg-zinc-950">
        {/* Problem tab */}
        {mobileTab === "problem" && (
          <div className="p-4 bg-zinc-900 min-h-full">
            {!isSolved && (
              <div className="mb-4">
                <span className="text-xs font-mono text-zinc-500">⏱ {timerFormatted}</span>
              </div>
            )}
            <ProblemHeader problem={problem} isSolved={isSolved} />
            <ProblemInfo problem={problem} />
            <Button onClick={() => setMobileTab("code")} className="mt-6 w-full">
              Start Coding →
            </Button>
          </div>
        )}

        {/* Code tab */}
        {mobileTab === "code" && (
          <div className="flex flex-col h-full min-h-[calc(100vh-108px)]">
            {error && (
              <div className="px-4 pt-3 flex-shrink-0">
                <ErrorBanner message={error} />
              </div>
            )}
            <div className="flex-1 min-h-0">
              <ErrorBoundary
                fallback={
                  <div className="h-full bg-zinc-900 border border-red-500 text-red-400 p-6 m-4 rounded-2xl">
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
          </div>
        )}

        {/* Results tab */}
        {mobileTab === "results" && (
          <div className="p-4">
            <SubmissionResultBanner submitInfo={submitInfo} />
            <WorkspacePanel
              runResults={runResults}
              submitInfo={submitInfo}
              isRunning={running}
              isSubmitting={submitting}
              forceTab={forceTab}
              problem={problem}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ProblemSolverMobileView;
