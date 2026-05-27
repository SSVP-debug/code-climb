import { useEffect, useMemo, useState } from "react";

import {
  useParams,
  Link,
} from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";

import Editor from "@monaco-editor/react";

import { runCode } from "../services/compiler";

import { judgeSubmission } from "../services/judgeService";

import problems from "../data/problems";

import { useAppContext } from "../hooks/useAppContext";
import {
  loadSavedCode,
  saveCode,
} from "../utils/editorStorage";

function ProblemDetailsPage() {

  const { title } = useParams();

  const problem = problems.find(
    (p) => p.slug === title
  );

  if (!problem) {

    return (
      <DashboardLayout>

        <div className="p-10 text-white">
          Problem not found.
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

function ProblemSolver({
  problem,
  title,
}) {

  const {
    solvedProblems,
    submissions: allSubmissions,
    addSubmission,
    markProblemSolved,
  } = useAppContext();

  const isSolved = solvedProblems.includes(title);

  const submissions = useMemo(
    () =>
      allSubmissions.filter(
        (s) => s.problemSlug === title
      ),
    [allSubmissions, title]
  );

  const [language, setLanguage] =
    useState("python");

  const [code, setCode] = useState(() =>
    loadSavedCode(
      title,
      "python",
      problem.starterCode.python
    )
  );

  useEffect(() => {
    saveCode(title, language, code);
  }, [title, language, code]);

  function handleLanguageChange(
    nextLanguage
  ) {
    saveCode(title, language, code);
    setLanguage(nextLanguage);
    setCode(
      loadSavedCode(
        title,
        nextLanguage,
        problem.starterCode[nextLanguage] || ""
      )
    );
  }

  const [output, setOutput] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [customInput, setCustomInput] =
    useState("");

  const [running, setRunning] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [judgeState, setJudgeState] =
    useState("");

  const [
    testcaseProgress,
    setTestcaseProgress,
  ] = useState(null);

  const [
    selectedSubmission,
    setSelectedSubmission,
  ] = useState(null);

  const currentIndex =
    problems.findIndex(
      (p) => p.slug === problem.slug
    );

  const previousProblem =
    problems[currentIndex - 1];

  const nextProblem =
    problems[currentIndex + 1];

  const languageMap = {
    python: 71,
    javascript: 63,
    java: 62,
    cpp: 54,
  };

  async function handleRunCode() {

    try {

      setRunning(true);

      const result = await runCode(
        code,
        languageMap[language],
        customInput
      );

      if (!result) {

        setStatus("Execution failed");

        setOutput("No response from code runner");

      } else if (result.stdout) {

        setStatus("Code Executed ✅");

        setOutput(result.stdout);

      } else if (result.stderr) {

        setStatus("Runtime Error ❌");

        setOutput(result.stderr);

      } else if (result.compile_output) {

        setStatus("Compilation Error ❌");

        setOutput(result.compile_output);

      } else {

        setStatus("No Output");

      }

    } catch (error) {

      console.error(error);

      setOutput("Something went wrong");

    } finally {

      setRunning(false);

    }
  }

  async function handleSubmitCode() {

    try {

      setSubmitting(true);

      setJudgeState("Queued");

      setJudgeState("Running");

      const judgeResult =
        await judgeSubmission({
          problem,
          code,
          language,
          onProgress:
            setTestcaseProgress,
        });

      setJudgeState("Completed");

      const newSubmission = {

        id: crypto.randomUUID(),

        problemTitle:
          problem.title,

        problemSlug:
          problem.slug,

        language,

        status:
          judgeResult.status,

        time:
          new Date().toLocaleTimeString(),

        date:
          new Date().toLocaleDateString(),

        passed:
          judgeResult.passed || 0,

        total:
          judgeResult.total || 0,

        visiblePassed:
          judgeResult.visiblePassed || 0,

        hiddenPassed:
          judgeResult.hiddenPassed || 0,

        expectedOutput:
          judgeResult.expectedOutput,

        actualOutput:
          judgeResult.actualOutput,

        executionTime:
          judgeResult.executionTime,
      };

      setStatus(
        judgeResult.status
      );

      setOutput(
        judgeResult.actualOutput || ""
      );

      // Accepted
      if (
        judgeResult.status ===
        "Accepted 🎉" &&
        !isSolved
      ) {
        await markProblemSolved({
          slug: title,
          topic: problem.topic,
          difficulty: problem.difficulty,
          title: problem.title,
        });
      }

      await addSubmission(newSubmission);

    } catch (error) {

      console.error(error);

      setStatus(
        "Submission Error ❌"
      );

    } finally {

      setSubmitting(false);

      setTestcaseProgress(null);

      setTimeout(() => {
        setJudgeState("");
      }, 2000);

    }
  }

  return (
    <DashboardLayout>

      <div className="p-8">

        {/* Header */}
        <div className="mb-8">

          <h1 className="text-4xl font-bold">
            {problem.title}
          </h1>

          <div className="flex items-center gap-4 mt-4">

            <span className="bg-zinc-800 px-4 py-2 rounded-xl">
              {problem.difficulty}
            </span>

            <span className="bg-zinc-800 px-4 py-2 rounded-xl">
              {problem.topic}
            </span>

          </div>

          {isSolved && (

            <div className="mt-4 inline-block bg-green-500 text-black px-4 py-2 rounded-xl font-semibold">

              Solved ✅

            </div>

          )}

        </div>

        {/* Description */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">

          <h2 className="text-2xl font-semibold mb-4">
            Problem Description
          </h2>

          <p className="text-zinc-300 leading-8">
            {problem.description}
          </p>

        </div>

        {/* Main Section */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Editor */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

            <div className="flex items-center justify-between mb-4">

              <h2 className="text-2xl font-semibold">
                Code Editor
              </h2>

              <select
                value={language}
                onChange={(e) =>
                  handleLanguageChange(
                    e.target.value
                  )
                }
                className="bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-lg outline-none"
              >

                <option value="python">
                  Python
                </option>

                <option value="javascript">
                  JavaScript
                </option>

                <option value="java">
                  Java
                </option>

                <option value="cpp">
                  C++
                </option>

              </select>

            </div>

            <Editor
              height="400px"
              language={language}
              value={code}
              onChange={(value) =>
                setCode(value || "")
              }
              theme="vs-dark"
            />

            <div className="mt-4">
              <label
                htmlFor="custom-input"
                className="block text-sm text-zinc-400 mb-2"
              >
                Custom input (optional)
              </label>
              <textarea
                id="custom-input"
                value={customInput}
                onChange={(e) =>
                  setCustomInput(e.target.value)
                }
                rows={3}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 font-mono text-sm outline-none"
                placeholder="stdin for Run Code"
              />
            </div>

            <div className="flex gap-4 mt-6">

              <button
                onClick={handleRunCode}
                disabled={running}
                className="bg-zinc-800 hover:bg-zinc-700 transition px-6 py-3 rounded-xl font-semibold"
              >
                {running
                  ? "Running..."
                  : "Run Code"}
              </button>

              <button
                onClick={handleSubmitCode}
                disabled={submitting}
                className={`px-6 py-3 rounded-xl font-semibold text-black transition ${
                  submitting
                    ? "bg-green-300 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600"
                }`}
              >
                {submitting
                  ? "Submitting..."
                  : "Submit"}
              </button>

            </div>

            {submitting && (

              <div className="mt-4 text-yellow-400 text-sm">

                Running hidden testcases...

              </div>

            )}

          </div>

          {/* Right Section */}
          <div>

            {/* Output */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

              <h3 className="text-xl font-semibold mb-4">
                Output
              </h3>

              {judgeState && (

                <div className="mb-4">

                  <span className="bg-zinc-800 px-3 py-1 rounded-lg text-sm">

                    Judge Status:
                    {" "}
                    {judgeState}

                  </span>

                </div>

              )}

              {testcaseProgress && (

                <div className="mb-4 text-sm text-blue-400">

                  Running testcase {
                    testcaseProgress.current
                  } / {
                    testcaseProgress.total
                  }

                </div>

              )}

              <p className="mb-3 font-semibold text-green-400">
                {status}
              </p>

              {submissions.length > 0 && (

                <div className="text-sm text-zinc-400 mb-4 space-y-1">

                  <p>
                    Passed {
                      submissions[0].passed || 0
                    } / {
                      submissions[0].total || 0
                    } testcases
                  </p>

                  <p>
                    Visible:
                    {" "}
                    {
                      submissions[0]
                        .visiblePassed || 0
                    }
                  </p>

                  <p>
                    Hidden:
                    {" "}
                    {
                      submissions[0]
                        .hiddenPassed || 0
                    }
                  </p>

                </div>

              )}

              {submissions.length > 0 &&
                submissions[0].status ===
                "Wrong Answer ❌" && (

                  <div className="mt-4 space-y-4">

                    <div>

                      <p className="text-red-400 mb-1">
                        Expected Output
                      </p>

                      <div className="bg-black border border-zinc-800 rounded-xl p-3 font-mono text-sm">

                        {JSON.stringify(
                          submissions[0]
                            .expectedOutput
                        )}

                      </div>

                    </div>

                    <div>

                      <p className="text-yellow-400 mb-1">
                        Your Output
                      </p>

                      <div className="bg-black border border-zinc-800 rounded-xl p-3 font-mono text-sm">

                        {
                          submissions[0]
                            .actualOutput
                        }

                      </div>

                    </div>

                  </div>

                )}

              <div className="bg-black border border-zinc-800 rounded-xl p-4 min-h-[120px] font-mono text-sm whitespace-pre-wrap">

                {output ||
                  "Run your code to see output..."}

              </div>

            </div>

            {/* Submission History */}
            <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

              <h3 className="text-xl font-semibold mb-4">
                Submission History
              </h3>

              <div className="space-y-3">

                {submissions.length === 0 ? (

                  <p className="text-zinc-400">
                    No submissions yet.
                  </p>

                ) : (

                  submissions.map(
                    (
                      submission,
                      index
                    ) => (

                      <div
                        key={index}
                        onClick={() =>
                          setSelectedSubmission(
                            submission
                          )
                        }
                        className="bg-zinc-800 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-zinc-700 transition"
                      >

                        <div>

                          <p className="font-semibold">
                            {
                              submission.status
                            }
                          </p>

                          <p className="text-zinc-400 text-sm mt-1">
                            {
                              submission.language
                            }
                          </p>

                          <p className="text-zinc-500 text-xs mt-1">
                            Runtime:
                            {" "}
                            {
                              submission.executionTime
                            } ms
                          </p>

                        </div>

                        <p className="text-zinc-500 text-sm">
                          {
                            submission.time
                          }
                        </p>

                      </div>

                    )
                  )

                )}

              </div>

            </div>

            {/* Submission Details */}
            {selectedSubmission && (

              <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

                <div className="flex items-center justify-between mb-6">

                  <h2 className="text-2xl font-semibold">
                    Submission Details
                  </h2>

                  <button
                    onClick={() =>
                      setSelectedSubmission(null)
                    }
                    className="bg-zinc-800 px-4 py-2 rounded-lg"
                  >
                    Close
                  </button>

                </div>

                <div className="space-y-4">

                  <div>

                    <p className="text-zinc-400 text-sm">
                      Status
                    </p>

                    <p className="font-semibold">
                      {
                        selectedSubmission.status
                      }
                    </p>

                  </div>

                  <div>

                    <p className="text-zinc-400 text-sm">
                      Language
                    </p>

                    <p>
                      {
                        selectedSubmission.language
                      }
                    </p>

                  </div>

                  <div>

                    <p className="text-zinc-400 text-sm">
                      Runtime
                    </p>

                    <p>
                      {
                        selectedSubmission.executionTime
                      } ms
                    </p>

                  </div>

                  <div>

                    <p className="text-zinc-400 text-sm">
                      Passed Testcases
                    </p>

                    <p>
                      {
                        selectedSubmission.passed
                      } / {
                        selectedSubmission.total
                      }
                    </p>

                  </div>

                  {selectedSubmission.expectedOutput && (

                    <div>

                      <p className="text-red-400 mb-2">
                        Expected Output
                      </p>

                      <div className="bg-black border border-zinc-800 rounded-xl p-3 font-mono text-sm">

                        {JSON.stringify(
                          selectedSubmission.expectedOutput
                        )}

                      </div>

                    </div>

                  )}

                  {selectedSubmission.actualOutput && (

                    <div>

                      <p className="text-yellow-400 mb-2">
                        Your Output
                      </p>

                      <div className="bg-black border border-zinc-800 rounded-xl p-3 font-mono text-sm whitespace-pre-wrap">

                        {
                          selectedSubmission.actualOutput
                        }

                      </div>

                    </div>

                  )}

                </div>

              </div>

            )}

          </div>

        </div>

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between">

          {previousProblem ? (

            <Link
              to={`/problems/${previousProblem.slug}`}
              className="bg-zinc-900 border border-zinc-800 px-6 py-3 rounded-xl hover:bg-zinc-800 transition"
            >
              ← {previousProblem.title}
            </Link>

          ) : (

            <div></div>

          )}

          {nextProblem ? (

            <Link
              to={`/problems/${nextProblem.slug}`}
              className="bg-zinc-900 border border-zinc-800 px-6 py-3 rounded-xl hover:bg-zinc-800 transition"
            >
              {nextProblem.title} →
            </Link>

          ) : (

            <div></div>

          )}

        </div>

      </div>

    </DashboardLayout>
  );
}

export default ProblemDetailsPage;