import ErrorBanner from "../components/ErrorBanner";
import ErrorBoundary from "../components/ErrorBoundary";
import { formatDate } from "../utils/formatters";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { runCode } from "../services/compiler";
import { judgeSubmission } from "../services/judgeService";
import problems from "../data/problems";
import { useAppContext } from "../hooks/useAppContext";
import { loadSavedCode, saveCode } from "../utils/editorStorage";
import { parseJudge0Result } from "../utils/parseJudge0Result";
import { useTimer } from "../hooks/useTimer";
import confetti from "canvas-confetti";
import { getStatusMeta } from "../utils/statusMessages";

// Sub-components
import ProblemHeader from "../components/problem/ProblemHeader";
import ProblemInfo from "../components/problem/ProblemInfo";
import ProblemEditor from "../components/problem/ProblemEditor";
import ProblemResults from "../components/problem/ProblemResults";
import SubmitResultCard from "../components/problem/SubmitResultCard";
import SubmissionHistory from "../components/problem/SubmissionHistory";
import SubmissionDetailsModal from "../components/problem/SubmissionDetailsModal";

// ── ProblemDetailsPage ────────────────────────────────────────────────────────
// Finds the problem by slug — renders 404 panel if not found.
// key={slug} on ProblemSolver resets all state when navigating between problems.

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

// ── ProblemSolver ─────────────────────────────────────────────────────────────
// All interactive state lives here. Rendered with key={slug} so navigating to
// a different problem fully resets this component tree.

function ProblemSolver({ problem, slug }) {
  const {
    solvedProblems,
    submissions: allSubmissions,
    addSubmission,
    markProblemSolved,
  } = useAppContext();

  const isSolved = solvedProblems.includes(slug);

  const submissions = useMemo(
    () => allSubmissions.filter((s) => s.problemSlug === slug),
    [allSubmissions, slug]
  );

  // ── Timer ──────────────────────────────────────────────────────────────
  const { formatted: timerFormatted, stop: stopTimer } = useTimer();

  // ── Editor state ───────────────────────────────────────────────────────
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(() =>
    loadSavedCode(slug, "python", problem.starterCode.python)
  );
  const [customInput, setCustomInput] = useState("");

  // ── Execution state ────────────────────────────────────────────────────
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /**
   * runResult — populated by handleRunCode.
   * Shape: { status, output, executionMeta }
   * Passed to ProblemResults for stdout / error display.
   */
  const [runResult, setRunResult] = useState(null);

  /**
   * submitResult — populated by handleSubmitCode.
   * Shape mirrors judgeResult + isFirstSolve flag:
   * {
   *   status, passed, total, visiblePassed, hiddenPassed,
   *   expectedOutput, actualOutput, executionTime,
   *   error,          ← compile/runtime/judge error text
   *   isFirstSolve,   ← true when this was the first Accepted
   * }
   * Passed to SubmitResultCard.
   */
  const [submitResult, setSubmitResult] = useState(null);

  // judgeState / testcaseProgress still used by ProblemResults loading indicator
  const [judgeState, setJudgeState] = useState("");
  const [testcaseProgress, setTestcaseProgress] = useState(null);

  const [selectedSubmission, setSelectedSubmission] = useState(null);

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

  const languageMap = {
    python: 71,
    javascript: 63,
    java: 62,
    cpp: 54,
  };

  // ── Run Code ───────────────────────────────────────────────────────────
  // Executes user code against the custom stdin panel input.
  // Updates runResult only — does NOT touch submitResult.
  const handleRunCode = async () => {
    if (running) return;

    try {
      setRunning(true);
      setError("");
      // Reset run result to show loading state in ProblemResults
      setRunResult({ status: "Running...", output: "", executionMeta: null });

      const result = await runCode(code, languageMap[language], customInput);
      const parsed = parseJudge0Result(result);

      const meta = getStatusMeta(
        parsed.kind === "success"   ? "Executed ✓" :
        parsed.kind === "compile"   ? "Compilation Error ❌" :
        parsed.kind === "runtime"   ? "Runtime Error ❌" :
        parsed.kind === "infra"     ? "Runner Unavailable ❌" :
                                      "Execution Failed ❌"
      );

      const output =
        parsed.kind === "success" ? parsed.stdout :
        parsed.kind === "runtime" ? parsed.stderr :
        parsed.kind === "compile" ? parsed.compileOutput :
        parsed.kind === "infra"   ? "Execution infrastructure error. Please try again." :
                                    parsed.stdout || "No output produced.";

      setRunResult({
        status: meta.label,    // human label from statusMessages (no emoji)
        rawStatus: parsed.kind === "success" ? "Executed ✓" :
                   parsed.kind === "compile" ? "Compilation Error ❌" :
                   parsed.kind === "runtime" ? "Runtime Error ❌" :
                   parsed.kind === "infra"   ? "Runner Unavailable ❌" :
                                              "Execution Failed ❌",
        output,
        executionMeta: {
          time: parsed.time,
          memory: parsed.memory,
          kind: parsed.kind,
        },
      });
    } catch (err) {
      console.error(err);
      setError("Execution failed. Please try again.");
      setRunResult({
        status: "Execution Failed",
        rawStatus: "Execution Failed ❌",
        output: "An unexpected error occurred during execution.",
        executionMeta: null,
      });
    } finally {
      setRunning(false);
    }
  };

  // ── Submit Code ────────────────────────────────────────────────────────
  // Runs against all testcases (visible + hidden) via backend judge.
  // Updates submitResult — does NOT touch runResult.
  const handleSubmitCode = async () => {
    if (submitting) return;

    // Snapshot isSolved BEFORE the async flow — used for isFirstSolve below.
    // After markProblemSolved() runs, isSolved will be true for all future renders.
    const wasAlreadySolved = isSolved;

    try {
      setSubmitting(true);
      setError("");
      setJudgeState("Queued");
      setTestcaseProgress(null);

      const judgeResult = await judgeSubmission({
        problem,
        code,
        language,
        onProgress: setTestcaseProgress,
      });

      setJudgeState("Completed");

      // ── Accepted: mark solved + stop timer + confetti ──────────────
      if (judgeResult.status === "Accepted 🎉") {
        if (!wasAlreadySolved) {
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

      // Set submitResult AFTER markProblemSolved so isFirstSolve is accurate
      setSubmitResult({
        status: judgeResult.status,
        passed: judgeResult.passed ?? 0,
        total: judgeResult.total ?? 0,
        visiblePassed: judgeResult.visiblePassed ?? 0,
        hiddenPassed: judgeResult.hiddenPassed ?? 0,
        expectedOutput: judgeResult.expectedOutput ?? null,
        actualOutput: judgeResult.actualOutput ?? null,
        executionTime: judgeResult.executionTime ?? null,
        error: judgeResult.error ?? null,
        isFirstSolve: judgeResult.status === "Accepted 🎉" && !wasAlreadySolved,
      });

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

      await addSubmission(newSubmission);
    } catch (err) {
      console.error(err);
      setError("Submission failed. Please try again.");
      setJudgeState("Failed");
      setSubmitResult({
        status: "Submission Error ❌",
        passed: 0,
        total: 0,
        error: err.message ?? "An unexpected error occurred.",
        isFirstSolve: false,
      });
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

            {/* Error Banner — network / auth failures only */}
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
              ── Results area ────────────────────────────────────────────
              Layout:
                Row 1: ProblemResults (run output) | SubmissionHistory
                Row 2: SubmitResultCard (full width — only after submission)

              WHY separate rows:
                SubmitResultCard needs the full width for the diff panel.
                ProblemResults + SubmissionHistory stay side-by-side as before.
            */}

            {/* Row 1: Run output + Submission history */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              <div className="h-full">
                <ProblemResults
                  status={runResult?.rawStatus ?? ""}
                  output={runResult?.output ?? ""}
                  executionMeta={runResult?.executionMeta ?? null}
                  judgeState={judgeState}
                  testcaseProgress={testcaseProgress}
                  submitting={submitting}
                />
              </div>
              <div className="h-[400px] md:h-auto overflow-hidden">
                <SubmissionHistory
                  submissions={submissions}
                  onSelectSubmission={setSelectedSubmission}
                />
              </div>
            </div>

            {/* Row 2: Submit result card — appears after first submission */}
            <SubmitResultCard
              submitResult={submitResult}
              isFirstSolve={submitResult?.isFirstSolve ?? false}
            />

          </div>
        </div>
      </div>

      {/* Submission details modal */}
      {selectedSubmission && (
        <SubmissionDetailsModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </DashboardLayout>
  );
}

export default ProblemDetailsPage;
