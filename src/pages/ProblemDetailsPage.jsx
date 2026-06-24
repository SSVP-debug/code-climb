import ErrorBanner from "../components/ErrorBanner";
import ErrorBoundary from "../components/ErrorBoundary";
import SubmissionResultBanner from "../components/workspace/SubmissionResultBanner";
import { formatDate } from "../utils/formatters";
import { getDailyChallenge, } from "../utils/dailyChallenge";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { judgeSubmission, runTestcases } from "../services/judgeService";
import { completeDailyChallenge, } from "../services/dailyChallengeService";
import problems from "../data/problems";
import { useAppContext } from "../hooks/useAppContext";
import { usePanelResize } from "../hooks/usePanelResize";
import { useVerticalResize } from "../hooks/useVerticalResize";
import {
  loadSavedCode,
  saveCode,
  loadLanguage,
  saveLanguage,
} from "../utils/editorStorage";
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

// ── Mobile tab bar ────────────────────────────────────────────────────────────

const MOBILE_TABS = [
  { id: "problem", label: "Problem" },
  { id: "code", label: "Code" },
  { id: "results", label: "Results" },
];

function MobileTabBar({ active, onChange, hasResults }) {
  return (
    <div className="flex border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
      {MOBILE_TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex-1 py-3 text-xs font-semibold uppercase tracking-widest
            transition-colors relative
            ${active === tab.id ? "text-white" : "text-zinc-500 hover:text-zinc-300"}
          `}
        >
          {tab.label}
          {tab.id === "results" && hasResults && (
            <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-green-400 align-middle" />
          )}
          {active === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  );
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

  const { editorHeight, setEditorHeight } = useVerticalResize();
  const [language, setLanguage] = useState(() =>
    loadLanguage(slug)
  );
  const [code, setCode] = useState(() => {
    const savedLanguage = loadLanguage(slug);

    return loadSavedCode(
      slug,
      savedLanguage,
      problem.starterCode[savedLanguage] || ""
    );
  });
  const [customInput, setCustomInput] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [runResults, setRunResults] = useState(null);
  const [submitInfo, setSubmitInfo] = useState(null);
  const { problemWidth, setProblemWidth } = usePanelResize();
  const [mobileTab, setMobileTab] = useState("problem");

  const forceTab = useMemo(
    () => deriveForceTab(runResults, submitInfo),
    [runResults, submitInfo]
  );

  // Auto-switch mobile to results after run/submit
  useEffect(() => {
    if (runResults || submitInfo) setMobileTab("results");
  }, [runResults, submitInfo]);

  useEffect(() => { saveCode(slug, language, code); }, [slug, language, code]);

  const handleLanguageChange = (nextLanguage) => {
    saveCode(slug, language, code);

    saveLanguage(slug, nextLanguage);

    setLanguage(nextLanguage);

    setCode(
      loadSavedCode(
        slug,
        nextLanguage,
        problem.starterCode[nextLanguage] || ""
      )
    );
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
    console.log("wasAlreadySolved =", wasAlreadySolved);
    console.log("isSolved =", isSolved);

    try {
      setSubmitting(true);
      setError("");
      setRunResults(null);
      setSubmitInfo(null);

      const judgeResult = await judgeSubmission({ problem, code, language, onProgress: () => { } });
      console.log("judgeResult.status =", judgeResult.status);
      console.log("wasAlreadySolved =", wasAlreadySolved);

      setSubmitInfo({
        status: judgeResult.status,
        error: judgeResult.error ?? null,
        passed: judgeResult.passed ?? 0,
        total: judgeResult.total ?? 0,
      });

      if (judgeResult.status === "Accepted 🎉" && !wasAlreadySolved) {
        console.log("[XP-TRACE 1] ProblemDetailsPage → markProblemSolved", {
          slug,
          difficulty: problem.difficulty,
        });
        await markProblemSolved({ slug, topic: problem.topic, difficulty: problem.difficulty, title: problem.title });
        try {
          const todayChallenge =
            getDailyChallenge();

          if (
            todayChallenge?.slug ===
            problem.slug
          ) {
            await completeDailyChallenge(
              problem.slug
            );
          }
        } catch (err) {
          console.error(
            "Daily challenge save failed:",
            err
          );
        }
        stopTimer();
        confetti({
          particleCount: 120, spread: 80, origin: { y: 0.6 },
          colors: ["#22c55e", "#16a34a", "#4ade80", "#ffffff", "#86efac"]
        });
        setTimeout(() => {
          confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.65 }, colors: ["#22c55e", "#4ade80", "#ffffff"] });
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
        code,
      });
    } catch (err) {
      console.error(err);
      setError("Submission failed. Please try again.");
      setSubmitInfo({ status: "Submission Error ❌", error: err.message ?? "Unexpected error.", passed: 0, total: 0 });
    } finally {
      setSubmitting(false);
    }
  };

  const hasResults = !!(runResults || submitInfo);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>

      {/* ── MOBILE LAYOUT (below lg) ──────────────────────────────────────── */}
      <div className="flex flex-col lg:hidden h-[calc(100vh-56px)] overflow-hidden -m-4 sm:-m-6">

        <MobileTabBar
          active={mobileTab}
          onChange={setMobileTab}
          hasResults={hasResults}
        />

        <div className="flex-1 min-h-0 overflow-y-auto bg-zinc-950">

          {/* Problem tab */}
          {mobileTab === "problem" && (
            <div className="p-4 bg-zinc-900 min-h-full">
              {!isSolved && (
                <div className="mb-4">
                  <span className="text-xs font-mono text-zinc-500">
                    ⏱ {timerFormatted}
                  </span>
                </div>
              )}
              <ProblemHeader problem={problem} isSolved={isSolved} />
              <ProblemInfo problem={problem} />
              <button
                onClick={() => setMobileTab("code")}
                className="mt-6 w-full py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition"
              >
                Start Coding →
              </button>
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

      {/* ── DESKTOP LAYOUT (lg and above) ────────────────────────────────── */}
      <div className="hidden lg:block -m-8">
        <div className="fixed inset-0 top-16 overflow-hidden bg-zinc-950">
          <div className="h-full overflow-hidden px-3 py-2">
            <div className="
flex
h-full
overflow-hidden
relative

gap-3
">

              {/* Left column — Problem description */}
              <div
                className="h-full overflow-hidden"
                style={{ width: `${problemWidth}%` }}
              >
                <div className="
  h-full
  overflow-y-auto
  custom-scrollbar
  bg-zinc-900
  border border-zinc-800
  rounded-2xl
  p-4
  shadow-xl
">
                  <ProblemHeader problem={problem} isSolved={isSolved} />
                  <ProblemInfo problem={problem} />
                </div>
              </div>

              {/* Resize handle */}
              <div
                className="w-1 mx-2 cursor-col-resize bg-zinc-800/40 rounded-full hover:bg-green-500 transition-colors"
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
              <div
                className="h-full flex flex-col overflow-hidden"
                style={{ width: `${100 - problemWidth}%` }}
              >
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

                <div
                  className="w-full h-2 cursor-row-resize rounded-full bg-zinc-800/40 hover:bg-green-500 transition-colors mb-2"
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
                  <div className="
  flex-1
  min-h-0
  overflow-hidden
  bg-zinc-900
  border border-zinc-800
  rounded-2xl
  shadow-xl
">
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
      </div>

    </DashboardLayout>
  );
}

export default ProblemDetailsPage;
