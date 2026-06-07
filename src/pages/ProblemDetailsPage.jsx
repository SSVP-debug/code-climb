import ErrorBanner from "../components/ErrorBanner";
import ErrorBoundary from "../components/ErrorBoundary";
import { formatDate } from "../utils/formatters";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { judgeSubmission, runTestcases } from "../services/judgeService";
import problems from "../data/problems";
import { useAppContext } from "../hooks/useAppContext";
import { loadSavedCode, saveCode } from "../utils/editorStorage";
import { useTimer } from "../hooks/useTimer";
import confetti from "canvas-confetti";

import ProblemHeader from "../components/problem/ProblemHeader";
import ProblemInfo from "../components/problem/ProblemInfo";
import ProblemEditor from "../components/problem/ProblemEditor";
import WorkspacePanel from "../components/problem/WorkspacePanel";

// ── Helpers ───────────────────────────────────────────────────────────────────

function deriveForceTab(runResults, submitInfo) {
  if (runResults?.compileFailed) return "debug";
  if (runResults?.results?.some((r) => r.error)) return "debug";
  if (runResults?.error && !runResults?.compileFailed) return "debug";
  if (runResults?.results?.length > 0) return "testcases";
  if (submitInfo?.status) {
    const s = submitInfo.status;
    if (s.includes("Compilation") || s.includes("Runtime") || s.includes("Error"))
      return "debug";
    return "testcases";
  }
  return null;
}

// ── ProblemDetailsPage ────────────────────────────────────────────────────────

function ProblemDetailsPage() {
  const { slug } = useParams();
  const problem = useMemo(() => problems.find((p) => p.slug === slug), [slug]);

  if (!problem) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Problem Not Found</h2>
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
  const { solvedProblems, addSubmission, markProblemSolved } = useAppContext();
  const isSolved = solvedProblems.includes(slug);
  const { formatted: timerFormatted, stop: stopTimer } = useTimer();

  const [language, setLanguage]       = useState("python");
  const [code, setCode]               = useState(() =>
    loadSavedCode(slug, "python", problem.starterCode.python)
  );
  const [customInput, setCustomInput] = useState("");
  const [running, setRunning]         = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState("");
  const [runResults, setRunResults]   = useState(null);
  const [submitInfo, setSubmitInfo]   = useState(null);

  const forceTab = useMemo(
    () => deriveForceTab(runResults, submitInfo),
    [runResults, submitInfo]
  );

  useEffect(() => { saveCode(slug, language, code); }, [slug, language, code]);

  const handleLanguageChange = (nextLanguage) => {
    saveCode(slug, language, code);
    setLanguage(nextLanguage);
    setCode(loadSavedCode(slug, nextLanguage, problem.starterCode[nextLanguage] || ""));
  };

  const handleRunCode = async () => {
    if (running) return;
    try {
      setRunning(true);
      setError("");
      setRunResults(null);
      setSubmitInfo(null);
      const response = await runTestcases({ problem, code, language });
      setRunResults(response);
    } catch (err) {
      console.error(err);
      setError("Execution failed. Please try again.");
      setRunResults({ results: [], compileFailed: false, error: err.message });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (submitting) return;
    const wasAlreadySolved = isSolved;
    try {
      setSubmitting(true);
      setError("");
      setRunResults(null);
      setSubmitInfo(null);

      const judgeResult = await judgeSubmission({ problem, code, language, onProgress: () => {} });

      setSubmitInfo({
        status: judgeResult.status,
        error:  judgeResult.error  ?? null,
        passed: judgeResult.passed ?? 0,
        total:  judgeResult.total  ?? 0,
      });

      if (judgeResult.status === "Accepted 🎉" && !wasAlreadySolved) {
        await markProblemSolved({ slug, topic: problem.topic, difficulty: problem.difficulty, title: problem.title });
        stopTimer();
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 },
          colors: ["#22c55e", "#16a34a", "#4ade80", "#ffffff", "#86efac"] });
        setTimeout(() => {
          confetti({ particleCount: 60, angle: 60,  spread: 55, origin: { x: 0, y: 0.65 }, colors: ["#22c55e", "#4ade80", "#ffffff"] });
          confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.65 }, colors: ["#22c55e", "#4ade80", "#ffffff"] });
        }, 200);
      }

      await addSubmission({
        id: crypto.randomUUID(), problemTitle: problem.title, problemSlug: problem.slug,
        language, status: judgeResult.status, date: formatDate(new Date()),
        createdAt: new Date().toISOString(),
        passed: judgeResult.passed || 0, total: judgeResult.total || 0,
        visiblePassed: judgeResult.visiblePassed || 0, hiddenPassed: judgeResult.hiddenPassed || 0,
        expectedOutput: judgeResult.expectedOutput, actualOutput: judgeResult.actualOutput,
        executionTime: judgeResult.executionTime,
      });
    } catch (err) {
      console.error(err);
      setError("Submission failed. Please try again.");
      setSubmitInfo({ status: "Submission Error ❌", error: err.message ?? "Unexpected error.", passed: 0, total: 0 });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  //
  // LAYOUT CONTRACT:
  //
  //  position: fixed          — escapes DashboardLayout's scroll container.
  //                             The page fills the viewport regardless of what
  //                             DashboardLayout does above it. The navbar sits
  //                             on top of this element, so we inset by the
  //                             navbar height (top-16 = 4rem = 64px).
  //                             Adjust top-16 if your navbar is a different height:
  //                               top-14 = 56px  |  top-16 = 64px  |  top-12 = 48px
  //
  //  overflow-hidden          — nothing escapes this viewport-locked container.
  //
  //  Two-column grid:
  //    Left  (5/12) — problem description, scrolls independently
  //    Right (7/12) — flex column:
  //                     [timer row]   flex-shrink-0
  //                     [editor]      flex-shrink-0, fixed height
  //                     [workspace]   flex-1 min-h-0, scrolls internally
  //
  return (
    <DashboardLayout>
      {/*
        ╔══════════════════════════════════════════════════════════════════╗
        ║  VIEWPORT LOCK                                                   ║
        ║  position:fixed + inset-0 fills entire viewport.                ║
        ║  top-16 pushes below the navbar (adjust if navbar height differs)║
        ║  overflow-hidden: airtight — no ancestor can scroll this.       ║
        ╚══════════════════════════════════════════════════════════════════╝
      */}
      <div className="fixed inset-0 top-16 overflow-hidden bg-zinc-950">

        {/*
          Padding wrapper — overflow-hidden so padding never causes scroll.
          h-full passes the constrained height down.
        */}
        <div className="h-full overflow-hidden px-4 py-3 sm:px-6 lg:px-8">

          {/*
            Two-column grid.
            h-full: fills the padding wrapper.
            overflow-hidden: grid never expands beyond its allocated height.
            items-stretch: both columns fill the row height equally.
          */}
          <div className="h-full overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/*
              ════════════════════════════════════════════════════
              LEFT COLUMN — Problem description
              ════════════════════════════════════════════════════
              h-full overflow-hidden: column is height-locked.
              Inner div: h-full overflow-y-auto = the ONLY scroll
              owner for problem description content.
            */}
            <div className="lg:col-span-5 h-full overflow-hidden">
              <div className="h-full overflow-y-auto custom-scrollbar bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <ProblemHeader problem={problem} isSolved={isSolved} />
                <ProblemInfo problem={problem} />
              </div>
            </div>

            {/*
              ════════════════════════════════════════════════════
              RIGHT COLUMN — Editor + Workspace
              ════════════════════════════════════════════════════
              h-full: fills the grid row.
              flex flex-col: vertical stack.
              overflow-hidden: column never expands beyond h-full.

              Children:
                flex-shrink-0 items → fixed height, never compress
                flex-1 min-h-0 item → claims remaining space exactly
            */}
            <div className="lg:col-span-7 h-full flex flex-col overflow-hidden">

              {/*
                Timer + difficulty row.
                flex-shrink-0: always exactly its natural height.
                pb-2: spacing to editor below (replaces gap).
              */}
              <div className="flex items-center justify-between flex-shrink-0 pb-2">
                <span className="text-xs text-zinc-500 font-mono tracking-widest">
                  {isSolved
                    ? <span className="text-green-500">✓ Solved</span>
                    : <>⏱ {timerFormatted}</>
                  }
                </span>
                <span className="text-xs text-zinc-600">
                  {problem.difficulty === "Easy"   && "🟢 Easy"}
                  {problem.difficulty === "Medium" && "🟡 Medium"}
                  {problem.difficulty === "Hard"   && "🔴 Hard"}
                </span>
              </div>

              {/*
                Error banner — only rendered when present.
                flex-shrink-0 + pb-2: does not compress siblings.
              */}
              {error && (
                <div className="flex-shrink-0 pb-2">
                  <ErrorBanner message={error} />
                </div>
              )}

              {/*
                Monaco editor.
                flex-shrink-0: fixed height, never compressed by workspace.
                h-[500px]: explicit height Monaco requires to render correctly.
                pb-3: spacing between editor and workspace.
                Do NOT add overflow here — Monaco renders decorations outside
                its own bounds and needs to paint freely.
              */}
              <div className="flex-shrink-0 h-[500px] pb-3">
                <ErrorBoundary
                  fallback={
                    <div className="h-full bg-zinc-900 border border-red-500 text-red-400 p-6 rounded-2xl">
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
                ════════════════════════════════════════════════
                WORKSPACE WRAPPER — the critical scroll region
                ════════════════════════════════════════════════
                flex-1:          claims ALL remaining vertical space
                                 after timer + editor + spacing.
                min-h-0:         WITHOUT this, flex children default to
                                 min-height:auto — the child refuses to
                                 shrink below its content height, defeating
                                 overflow-y-auto inside WorkspacePanel.
                                 This is the #1 cause of workspace overflow
                                 escaping into the page.
                overflow-hidden: nothing escapes this wrapper.
                                 WorkspacePanel's own overflow-y-auto is
                                 the scroll owner — not this div.

                WorkspacePanel must be h-full to fill this wrapper.
                It already is (set in WorkspacePanel.jsx).
              */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <WorkspacePanel
                  runResults={runResults}
                  submitInfo={submitInfo}
                  isRunning={running}
                  isSubmitting={submitting}
                  forceTab={forceTab}
                />
              </div>

            </div>
            {/* end right column */}

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ProblemDetailsPage;