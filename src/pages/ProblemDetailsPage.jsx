import ErrorBanner from "../components/ErrorBanner";
import ErrorBoundary from "../components/ErrorBoundary";
import { formatDate } from "../utils/formatters";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { judgeSubmission, runtestcases } from "../services/judgeService";
import problems from "../data/problems";
import { useAppContext } from "../hooks/useAppContext";
import { loadSavedCode, saveCode } from "../utils/editorStorage";
import { useTimer } from "../hooks/useTimer";
import confetti from "canvas-confetti";

// Sub-components
import ProblemHeader from "../components/problem/ProblemHeader";
import ProblemInfo from "../components/problem/ProblemInfo";
import ProblemEditor from "../components/problem/ProblemEditor";
import WorkspacePanel from "../components/problem/WorkspacePanel";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Derives which workspace tab should be forced active after a result arrives.
 * Returns "debug" | "testcases" | null.
 * null = no override (don't change the current tab).
 */
function deriveForceTab(runResults, submitInfo) {
  // Run: compile error or any testcase with a runtime error → debug
  if (runResults?.compileFailed) return "debug";
  if (
    runResults?.results?.some(
      (r) =>
        r.error ||
        String(r.actual ?? "").trim().startsWith("RUNTIME_ERROR:")
    )
  ) {
    return "debug";
  }
  // Run: top-level network/infra error → debug
  if (runResults?.error && !runResults?.compileFailed) return "debug";
  // Run: results present with no errors → testcases
  if (runResults?.results?.length > 0) return "testcases";

  // Submit: any error verdict → debug
  if (submitInfo?.status) {
    const s = submitInfo.status;
    if (
      s.includes("Compilation") ||
      s.includes("Runtime") ||
      s.includes("Error") // covers "Judge Error", "Submission Error"
    ) return "debug";
    // Accepted or Wrong Answer → testcases
    return "testcases";
  }

  return null;
}

// ── ProblemDetailsPage ────────────────────────────────────────────────────────

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

function ProblemSolver({ problem, slug }) {
  const {
    solvedProblems,
    submissions: allSubmissions,
    addSubmission,
    markProblemSolved,
  } = useAppContext();

  const isSolved = solvedProblems.includes(slug);

  // ── Timer ──────────────────────────────────────────────────────────────
  const { formatted: timerFormatted, stop: stopTimer } = useTimer();

  // ── Editor state ───────────────────────────────────────────────────────
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(() =>
    loadSavedCode(slug, "python", problem.starterCode.python)
  );
  const [customInput, setCustomInput] = useState("");

  // ── Execution flags ────────────────────────────────────────────────────
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ── Run result — feeds WorkspacePanel → TestcaseResultPanel ───────────
  // Shape: { results, compileFailed, error } | null
  const [runResults, setRunResults] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  // ── Submit result — feeds WorkspacePanel → debugPanel ─────────────────
  // Shape: { status, error, passed, total } | null
  const [submitInfo, setSubmitInfo] = useState(null);

  // ── Derived: which tab WorkspacePanel should force-activate ───────────
  const forceTab = useMemo(
    () => deriveForceTab(runResults, submitInfo),
    [runResults, submitInfo]
  );
  console.log("FORCE TAB =", forceTab);
  console.log("RUN RESULTS =", runResults);

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
  const handleRunCode = async () => {
    if (running) return;

    try {
      setRunning(true);
      setError("");
      setRunResults(null);   // triggers skeleton in panel
      setSubmitInfo(null);   // clear stale submit result from workspace

      const response = await runtestcases({ problem, code, language });
      setRunResults(response);
      let debug = null;

      for (const r of response.results || []) {
        const actual = String(r.actual ?? "").trim();

        if (actual.startsWith("RUNTIME_ERROR:")) {
          debug = {
            type: "runtime",
            message: actual.replace(/^RUNTIME_ERROR:\s*/, ""),
            testcase: r.index + 1,
          };
          break;
        }

        if (r.error) {
          debug = {
            type: "runtime",
            message: r.error,
            testcase: r.index + 1,
          };
          break;
        }
      }

      if (response.compileFailed) {
        debug = {
          type: "compile",
          message: response.error,
        };
      }

      setDebugInfo(debug);

    } catch (err) {
      console.error(err);
      setError("Execution failed. Please try again.");
      setRunResults({ results: [], compileFailed: false, error: err.message });
    } finally {
      setRunning(false);
    }
  };

  // ── Submit Code ────────────────────────────────────────────────────────
  const handleSubmitCode = async () => {
    if (submitting) return;

    const wasAlreadySolved = isSolved;

    try {
      setSubmitting(true);
      setError("");
      setRunResults(null);   // clear run results while judging
      setSubmitInfo(null);

      const judgeResult = await judgeSubmission({
        problem,
        code,
        language,
        onProgress: () => { },  // progress stub — SSE not yet implemented
      });

      // Feed the submit verdict into WorkspacePanel
      setSubmitInfo({
        status: judgeResult.status,
        error: judgeResult.error ?? null,
        passed: judgeResult.passed ?? 0,
        total: judgeResult.total ?? 0,
      });

      // ── Accepted ───────────────────────────────────────────────────
      if (judgeResult.status === "Accepted 🎉" && !wasAlreadySolved) {
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

      // Persist submission record
      await addSubmission({
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
      });

    } catch (err) {
      console.error(err);
      setError("Submission failed. Please try again.");
      setSubmitInfo({
        status: "Submission Error ❌",
        error: err.message ?? "An unexpected error occurred.",
        passed: 0,
        total: 0,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── Left: problem description ────────────────────────────── */}
          <div className="lg:col-span-5">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 lg:sticky lg:top-8 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
              <ProblemHeader problem={problem} isSolved={isSolved} />
              <ProblemInfo problem={problem} />
            </div>
          </div>

          {/* ── Right: editor + workspace ────────────────────────────── */}
          <div className="lg:col-span-7 space-y-4">

            {/* Timer + difficulty row */}
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

            {/* Error banner — network/auth failures only */}
            {error && <ErrorBanner message={error} />}

            {/* Monaco editor */}
            <div className="h-[580px]">
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
              WorkspacePanel — full width below the editor.
              Contains testcases | debug tabs.
              forceTab drives auto-switch on every new result.
            */}
            <WorkspacePanel
              runResults={runResults}
              submitInfo={submitInfo}
              debugInfo={debugInfo}
              isRunning={running}
              isSubmitting={submitting}
              forceTab={forceTab}
            />

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ProblemDetailsPage;
