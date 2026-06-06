
import ErrorBanner from "../components/ErrorBanner";
import ErrorBoundary from "../components/ErrorBoundary";
import { formatDate } from "../utils/formatters";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { judgeSubmission, runTestcases } from "../services/judgeService"; // ← runCode import removed; runTestcases added
import problems from "../data/problems";
import { useAppContext } from "../hooks/useAppContext";
import { loadSavedCode, saveCode } from "../utils/editorStorage";
import { useTimer } from "../hooks/useTimer";                               // ← parseJudge0Result import removed (no longer used by Run)
import confetti from "canvas-confetti";

// Sub-components
import ProblemHeader from "../components/problem/ProblemHeader";
import ProblemInfo from "../components/problem/ProblemInfo";
import ProblemEditor from "../components/problem/ProblemEditor";
import ProblemResults from "../components/problem/ProblemResults";
import TestcaseResultPanel from "../components/problem/TestcaseResultPanel"; // ← NEW
import SubmissionHistory from "../components/problem/SubmissionHistory";
import SubmissionDetailsModal from "../components/problem/SubmissionDetailsModal";
import BottomWorkspaceTabs from "../components/problem/BottomWorkspaceTabs";
import DebugPanel from "../components/problem/DebugPanel";

function ProblemDetailsPage() {
  const { slug } = useParams();

  const problem = useMemo(
    () => problems.find((p) => p.slug === slug),
    [slug]
  );

  if (!problem) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Problem Not Found
            </h2>
            <p className="text-zinc-500 mb-6">
              The problem you're looking for doesn't exist or has been moved.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return <ProblemSolver key={slug} problem={problem} slug={slug} />;
}

function ProblemSolver({ problem, slug }) {
  const {
    solvedProblems,
    submissions: allSubmissions,
    addSubmission,
    markProblemSolved,
  } = useAppContext();

  const isSolved = solvedProblems.includes(slug);
  const [activeBottomTab, setActiveBottomTab] = useState("Testcases");
  const submissions = useMemo(
    () => allSubmissions.filter((s) => s.problemSlug === slug),
    [allSubmissions, slug]
  );
  const [runResults, setRunResults] = useState(null);
  const runtimeError =
    runResults?.results?.find((r) => r.error)?.error;


  // ── Timer ──────────────────────────────────────────────────────────────
  const { formatted: timerFormatted, stop: stopTimer } = useTimer();


  // ── State ──────────────────────────────────────────────────────────────
  const [language, setLanguage] = useState("python");
  const [error, setError] = useState("");
  const [code, setCode] = useState(() =>
    loadSavedCode(slug, "python", problem.starterCode.python)
  );
  const [customInput, setCustomInput] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [judgeState, setJudgeState] = useState("");
  const [testcaseProgress, setTestcaseProgress] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);


  // Submit result state (unchanged — feeds ProblemResults)
  const [status, setStatus] = useState("");
  const [output, setOutput] = useState("");
  const [executionMeta, setExecutionMeta] = useState(null);


  // ── NEW: Run result state — feeds TestcaseResultPanel ─────────────────
  // Shape: { results: [...], compileFailed: bool, error: string|null } | null
  // null = never been run yet (shows idle panel)


  // ── Sync code to storage ───────────────────────────────────────────────
  useEffect(() => {
    saveCode(slug, language, code);
  }, [slug, language, code]);

  // ── Language change ────────────────────────────────────────────────────
  const handleLanguageChange = (nextLanguage) => {
    saveCode(slug, language, code);
    setLanguage(nextLanguage);
    setCode(
      loadSavedCode(slug, nextLanguage, problem.starterCode[nextLanguage] || "")
    );
  };

  // ── Run Code ───────────────────────────────────────────────────────────
  // CHANGED: now calls runTestcases() → /api/judge/run with driver wrapping.
  // Sets runResults state which feeds TestcaseResultPanel.
  // No longer sets status/output/executionMeta (those belong to Submit).
  const handleRunCode = async () => {
    if (running) return;

    try {
      setRunning(true);
      setError("");
      // Clear previous run results so the skeleton loading state shows
      setRunResults(null);

      const response = await runTestcases({ problem, code, language });
      console.log("RUN RESPONSE", response);

      const hasRuntimeError =
        response.results?.some((r) => r.error);

      if (hasRuntimeError || response.compileFailed) {
        setActiveBottomTab("Debug");
      } else {
        setActiveBottomTab("Testcases");
      }

      // response shape: { results, compileFailed, error }
      setRunResults(response);

    } catch (err) {
      console.error(err);
      setError("Execution failed. Please try again.");
      // Show an error state in the panel without crashing
      setRunResults({ results: [], compileFailed: false, error: err.message });
    } finally {
      setRunning(false);
    }
  };

  // ── Submit Code ────────────────────────────────────────────────────────
  // UNCHANGED — sets status/output/executionMeta which feed ProblemResults.
  const handleSubmitCode = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      setError("");
      setJudgeState("Queued");
      setExecutionMeta(null);
      setStatus("Judging...");

      const judgeResult = await judgeSubmission({
        problem,
        code,
        language,
        onProgress: setTestcaseProgress,
      });

      setJudgeState("Completed");
      setStatus(judgeResult.status);
      setOutput(judgeResult.actualOutput || "");

      const newSubmission = {
        id: crypto.randomUUID(),
        problemTitle: problem.title,
        problemSlug: problem.slug,
        language,
        status: judgeResult.status,
        date: formatDate(new Date()),
        createdAt: new Date().toISOString(),
        passed: judgeResult.passed || 0,
        total: judgeResult.total || 0,
        visiblePassed: judgeResult.visiblePassed || 0,
        hiddenPassed: judgeResult.hiddenPassed || 0,
        expectedOutput: judgeResult.expectedOutput,
        actualOutput: judgeResult.actualOutput,
        executionTime: judgeResult.executionTime,
      };


      if (judgeResult.status === "Accepted 🎉") {
        if (!isSolved) {
          await markProblemSolved({
            slug,
            topic: problem.topic,
            difficulty: problem.difficulty,
            title: problem.title,
          });

          stopTimer();

          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#22c55e", "#16a34a", "#4ade80", "#ffffff", "#86efac"],
          });

          setTimeout(() => {
            confetti({
              particleCount: 60,
              angle: 60,
              spread: 55,
              origin: { x: 0, y: 0.65 },
              colors: ["#22c55e", "#4ade80", "#ffffff"],
            });
            confetti({
              particleCount: 60,
              angle: 120,
              spread: 55,
              origin: { x: 1, y: 0.65 },
              colors: ["#22c55e", "#4ade80", "#ffffff"],
            });
          }, 200);
        }
      }

      await addSubmission(newSubmission);
    } catch (error) {
      console.error(error);
      setError("Submission failed. Please try again.");
      setStatus("Submission Error ❌");
      setJudgeState("Failed");
    } finally {
      setSubmitting(false);
      setTestcaseProgress(null);
      setTimeout(() => setJudgeState(""), 3000);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column — problem description */}
          <div className="lg:col-span-5 h-full space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 lg:sticky lg:top-8 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
              <ProblemHeader problem={problem} isSolved={isSolved} />
              <ProblemInfo problem={problem} />
            </div>
          </div>

          {/* Right Column — editor + results */}
          <div className="lg:col-span-7 space-y-6">

            {/* Timer row */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 font-mono tracking-widest">
                {isSolved ? (
                  <span className="text-green-500">✓ Solved</span>
                ) : (
                  <>⏱ {timerFormatted}</>
                )}
              </span>
              <span className="text-xs text-zinc-600">
                {problem.difficulty === "Easy" && "🟢 Easy"}
                {problem.difficulty === "Medium" && "🟡 Medium"}
                {problem.difficulty === "Hard" && "🔴 Hard"}
              </span>
            </div>

            {/* Error Banner */}
            {error && <ErrorBanner message={error} />}

            {/* Editor */}
            <div className="h-[600px]">
              <ErrorBoundary
                fallback={
                  <div className="bg-zinc-900 border border-red-500 text-red-400 p-6 rounded-2xl">
                    Editor failed to load.
                  </div>
                }
              >
                {runtimeError && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                    <div className="font-semibold text-red-400">
                      Runtime Error ⚠️
                    </div>
                    <div className="text-red-300 text-sm font-mono">
                      {runtimeError}
                    </div>
                  </div>
                )}

                <ProblemEditor
                  language={language}
                  setLanguage={handleLanguageChange}
                  code={code}
                  setCode={setCode}
                  customInput={customInput}
                  setCustomInput={setCustomInput}
                  onRun={handleRunCode}
                  onSubmit={handleSubmitCode}
                  running={running}
                  submitting={submitting}
                />
              </ErrorBoundary>
            </div>

            {/*
              Results area
              ┌─────────────────────┬──────────────────────┐
              │ TestcaseResultPanel │  SubmissionHistory   │
              │  (Run results)      │                      │
              └─────────────────────┴──────────────────────┘
              ┌────────────────────────────────────────────┐
              │ ProblemResults (Submit verdict)            │
              └────────────────────────────────────────────┘

              TestcaseResultPanel replaces the old ProblemResults position.
              ProblemResults moves below at full width — only visible after Submit.
              This keeps the side-by-side layout identical to before while giving
              the run panel the same real estate it always had.
            */}
            <div className="space-y-4">
              <BottomWorkspaceTabs
                activeTab={activeBottomTab}
                setActiveTab={setActiveBottomTab}
              />

              {activeBottomTab === "Testcases" ? (
                <TestcaseResultPanel
                  results={runResults?.results ?? null}
                  compileFailed={runResults?.compileFailed ?? false}
                  compileError={runResults?.error ?? null}
                  isRunning={running}
                />
              ) : (
                <DebugPanel />
              )}
            </div>

            {/* Submit verdict — only rendered when status is non-empty */}
            {status && (
              <ProblemResults
                status={status}
                output={output}
                executionMeta={executionMeta}
                judgeState={judgeState}
                testcaseProgress={testcaseProgress}
                submitting={submitting}
              />
            )}

          </div>
        </div>
      </div>

      {
        selectedSubmission && (
          <SubmissionDetailsModal
            submission={selectedSubmission}
            onClose={() => setSelectedSubmission(null)}
          />
        )
      }
    </DashboardLayout >
  );
}

export default ProblemDetailsPage;                          