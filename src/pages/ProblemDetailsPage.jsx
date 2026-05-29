import ErrorBanner from "../components/ErrorBanner";
import {
  formatDate,
  formatDateTime,
  formatRuntime,
  formatMemory,
} from "../utils/formatters";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { runCode } from "../services/compiler";
import { judgeSubmission } from "../services/judgeService";
import problems from "../data/problems";
import { useAppContext } from "../hooks/useAppContext";
import { loadSavedCode, saveCode } from "../utils/editorStorage";
import { parseJudge0Result } from "../utils/parseJudge0Result";

// Sub-components
import ProblemHeader from "../components/problem/ProblemHeader";
import ProblemInfo from "../components/problem/ProblemInfo";
import ProblemEditor from "../components/problem/ProblemEditor";
import ProblemResults from "../components/problem/ProblemResults";
import SubmissionHistory from "../components/problem/SubmissionHistory";
import SubmissionDetailsModal from "../components/problem/SubmissionDetailsModal";

function ProblemDetailsPage() {
  const { title } = useParams();
  const problem = useMemo(() => problems.find((p) => p.slug === title), [title]);

  if (!problem) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Problem Not Found</h2>
            <p className="text-zinc-500 mb-6">The problem you're looking for doesn't exist or has been moved.</p>
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

  return (
    <ProblemSolver
      key={title}
      problem={problem}
      title={title}
    />
  );
}

function ProblemSolver({ problem, title }) {
  const {
    solvedProblems,
    submissions: allSubmissions,
    addSubmission,
    markProblemSolved,
  } = useAppContext();

  const isSolved = solvedProblems.includes(title);

  const submissions = useMemo(
    () => allSubmissions.filter((s) => s.problemSlug === title),
    [allSubmissions, title]
  );

  // State Management
  const [language, setLanguage] = useState("python");
  const [error, setError] = useState("");
  const [code, setCode] = useState(() =>
    loadSavedCode(title, "python", problem.starterCode.python)
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

  // Sync code to storage
  useEffect(() => {
    saveCode(title, language, code);
  }, [title, language, code]);

  const handleLanguageChange = (nextLanguage) => {
    saveCode(title, language, code);
    setLanguage(nextLanguage);
    setCode(
      loadSavedCode(
        title,
        nextLanguage,
        problem.starterCode[nextLanguage] || ""
      )
    );
  };

  const languageMap = {
    python: 71,
    javascript: 63,
    java: 62,
    cpp: 54,
  };

  const handleRunCode = async () => {
    try {
      setRunning(true);
      setStatus("Running...");
      setExecutionMeta(null);
      setError("Execution failed. Please try again.");

      const result = await runCode(
        code,
        languageMap[language],
        customInput
      );

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
      setStatus("Execution Failed ❌");
      setOutput("An unexpected error occurred during execution.");
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    try {
      setSubmitting(true);
      setJudgeState("Queued");
      setExecutionMeta(null);
      setStatus("Judging...");
      setError("Submission failed. Please try again.");

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

      // Mark as solved if accepted
      if (judgeResult.status === "Accepted 🎉") {
        if (!isSolved) {
          await markProblemSolved({
            slug: title,
            topic: problem.topic,
            difficulty: problem.difficulty,
            title: problem.title,
          });
        }
      }

      await addSubmission(newSubmission);
    } catch (error) {
      console.error(error);
      setStatus("Submission Error ❌");
      setJudgeState("Failed");
    } finally {
      setSubmitting(false);
      setTestcaseProgress(null);
      setTimeout(() => setJudgeState(""), 3000);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Problem Info */}
          <div className="lg:col-span-5 h-full space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 lg:sticky lg:top-8 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
              <ProblemHeader
                problem={problem}
                isSolved={isSolved}
              />
              <ProblemInfo
                problem={problem}
              />
            </div>
          </div>

          {/* Right Column: Editor & Results */}
          <div className="lg:col-span-7 space-y-6">
            {/* Editor Section */}
            <div className="h-[600px]">
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
            </div>

            {/* Results & History Grid */}
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

      {/* Modals */}
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