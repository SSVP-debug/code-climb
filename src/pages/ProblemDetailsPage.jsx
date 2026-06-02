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

// Sub-components
import ProblemHeader from "../components/problem/ProblemHeader";
import ProblemInfo from "../components/problem/ProblemInfo";
import ProblemEditor from "../components/problem/ProblemEditor";
import ProblemResults from "../components/problem/ProblemResults";
import SubmissionHistory from "../components/problem/SubmissionHistory";
import SubmissionDetailsModal from "../components/problem/SubmissionDetailsModal";

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

  // key={slug} resets all state (including timer) when navigating between problems
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

  const submissions = useMemo(
    () => allSubmissions.filter((s) => s.problemSlug === slug),
    [allSubmissions, slug]
  );

  // ── Timer ──────────────────────────────────────────────────────────────
  const { formatted: timerFormatted, stop: stopTimer } = useTimer();

  // ── State ──────────────────────────────────────────────────────────────
  const [language, setLanguage] = useState("python");
  const [error, setError] = useState("");
  const [code, setCode] = useState(() =>
    loadSavedCode(slug, "python", problem.starterCode.python)
  );
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [judgeState, setJudgeState] = useState("");
  const [testcaseProgress, setTestcaseProgress] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [executionMeta, setExecutionMeta] = useState(null);

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
  const handleRunCode = async () => {
    if (running) return;

    try {
      setRunning(true);
      setError("");
      setStatus("Running...");
      setExecutionMeta(null);

      const result = await runCode(code, languageMap[language], customInput);
      const parsed = parseJudge0Result(result);

      setExecutionMeta({
        time: parsed.time,
        memory: parsed.memory,
        kind: parsed.kind,
      });

      setStatus(parsed.status);

      if (parsed.kind === "success") {
        setOutput(parsed.stdout);
      } else if (parsed.kind === "runtime") {
        setOutput(parsed.stderr);
      } else if (parsed.kind === "compile") {
        setOutput(parsed.compileOutput);
      } else if (parsed.kind === "infra") {
        setOutput("Execution infrastructure error. Please try again.");
      } else {
        setOutput(parsed.stdout || "No output produced.");
      }
    } catch (error) {
      console.error(error);
      setError("Execution failed. Please try again.");
      setStatus("Execution Failed ❌");
      setOutput("An unexpected error occurred during execution.");
    } finally {
      setRunning(false);
    }
  };

  // ── Submit Code ────────────────────────────────────────────────────────
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

      // ── Accepted: mark solved + stop timer + confetti ──────────────
      if (judgeResult.status === "Accepted 🎉") {
        if (!isSolved) {
          await markProblemSolved({
            slug,
            topic: problem.topic,
            difficulty: problem.difficulty,
            title: problem.title,
          });

          // Stop the timer — problem is solved
          stopTimer();

          // Confetti burst
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#22c55e", "#16a34a", "#4ade80", "#ffffff", "#86efac"],
          });

          // Second burst with slight delay for a fuller effect
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

            {/* Results + History */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              <div className="h-full">
                <ProblemResults
                  status={status}
                  output={output}
                  executionMeta={executionMeta}
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
