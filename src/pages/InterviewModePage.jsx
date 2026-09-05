import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import DashboardLayout from "../layouts/DashboardLayout";
import { apiFetch } from "../services/api";
import PageMeta from "../components/seo/PageMeta";
import Button from "../components/ui/Button";
import UpgradePrompt from "../components/ui/UpgradePrompt";
import ErrorBanner from "../components/ErrorBanner";
import { useHideDifficultyLabels } from "../hooks/useHideDifficultyLabels";
import { useLanguages } from "../hooks/useLanguages";
import { useBWMode } from "../hooks/useBWMode";

function formatTime(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function InterviewModePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const hideDifficulty = useHideDifficultyLabels();
  // Content & Execution Architecture cross-check follow-up (Phase 6):
  // this page's language <select> used to be a completely separate,
  // hardcoded set of 4 <option> tags — a second copy of the same
  // hardcoding already found and fixed once in ProblemEditor.jsx /
  // ProblemForm.jsx this session, missed because it's a genuinely
  // separate component tree with no shared UI, not because the fix
  // pattern was wrong. See docs/adding-a-language.md's caveat on why
  // "no frontend hardcoding" needs a per-file grep, not a one-time check.
  const { languages } = useLanguages();
  const { bwMode } = useBWMode();

  const [session, setSession]       = useState(null);
  const [code, setCode]             = useState("// Think out loud — explain your approach before coding.\n");
  const [language, setLanguage]     = useState("python");
  const [chatLog, setChatLog]       = useState([]);
  const [userInput, setUserInput]   = useState("");
  const [timeLeft, setTimeLeft]     = useState(45 * 60 * 1000);
  const [submitted, setSubmitted]   = useState(false);
  const [asking, setAsking]         = useState(false);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [upgrade, setUpgrade]       = useState(null); // audit fix: structured 402 body (upgradeUrl, currentPlan)

  const timerRef = useRef(null);

  // ── Start session on mount ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const data = await apiFetch("/api/interview/start", {
          method: "POST",
          body: JSON.stringify({ slug }),
        });
        if (cancelled) return;

        setSession(data);
        setTimeLeft(data.durationMs);
        setChatLog([{
          role: "interviewer",
          text: `Let's begin. Tell me how you'd approach "${data.problem.title}" — what's your first instinct?`,
        }]);
      } catch (err) {
        if (cancelled) return;
        if (err.status === 402) {
          setUpgrade(err.body || {});
        } else {
          setError(err.message || "Failed to start interview session.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    start();
    return () => { cancelled = true; };
  }, [slug]);

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [session, submitted]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAsk = useCallback(async () => {
    if (!userInput.trim() || asking || !session) return;
    const message = userInput.trim();
    setUserInput("");
    setChatLog(prev => [...prev, { role: "candidate", text: message }]);
    setAsking(true);

    try {
      const data = await apiFetch("/api/interview/ask", {
        method: "POST",
        body: JSON.stringify({ sessionId: session.sessionId, userMessage: message, currentCode: code }),
      });
      if (data.question) {
        setChatLog(prev => [...prev, { role: "interviewer", text: data.question }]);
      }
    } catch {
      setChatLog(prev => [...prev, { role: "interviewer", text: "Sorry, I lost my train of thought. Continue?" }]);
    }
    setAsking(false);
  }, [userInput, asking, session, code]);

  async function handleSubmit() {
    if (!session || submitted) return;
    setSubmitError(null);
    try {
      await apiFetch("/api/interview/submit", {
        method: "POST",
        body: JSON.stringify({ sessionId: session.sessionId }),
      });
      // Only flip to the "Interview Complete" screen once the server has
      // actually confirmed the submission — previously this was set
      // optimistically before the request, so a failed submit (network
      // drop, backend error) still showed "Interview Complete" while the
      // interview was silently never recorded server-side.
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || "Couldn't submit your interview. Please try again.");
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (upgrade) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
          <UpgradePrompt
            feature="Interview Mode"
            message={upgrade.error || "Interview Mode requires Code Club Pro."}
            upgradeUrl={upgrade.upgradeUrl || "/pricing"}
          />
          <button
            onClick={() => navigate(`/problems/${slug}`)}
            className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
          >
            Back to Problem
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center max-w-md">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Interview Mode Unavailable</h2>
            <p className="text-[var(--muted-foreground)] text-sm mb-6">{error}</p>
            <button
              onClick={() => navigate(`/problems/${slug}`)}
              className="px-5 py-2 bg-[var(--surface-elevated)] hover:brightness-110 text-[var(--foreground)] rounded-xl transition"
            >
              Back to Problem
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const urgent = timeLeft < 5 * 60 * 1000; // last 5 minutes

  return (
    <DashboardLayout>
      <PageMeta title={`Interview Mode · ${session?.problem?.title} · Code Club`} path={`/interview/${slug}`} />

      <div className="flex flex-col h-[calc(100vh-90px)]">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[var(--surface)] border-b border-[var(--border)]">
          <div>
            <h1 className="text-lg font-bold text-[var(--foreground)]">{session?.problem?.title}</h1>
            <p className="text-xs text-[var(--muted-foreground)]">
              Live Interview Mode{!hideDifficulty && session?.problem?.difficulty ? ` · ${session.problem.difficulty}` : ""}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg ${
            urgent ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-[var(--surface-elevated)] text-teal-400"
          }`}>
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>

        {submitted ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-[var(--surface)] border border-teal-500/30 rounded-2xl p-8 text-center max-w-md">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Interview Complete</h2>
              <p className="text-[var(--muted-foreground)] text-sm mb-2">{chatLog.filter(c=>c.role==="interviewer").length} questions asked</p>
              <p className="text-[var(--muted-foreground)] text-xs mb-6">Time used: {formatTime(session.durationMs - timeLeft)}</p>
              <Button onClick={() => navigate(`/problems/${slug}`)}>
                Back to Problem
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Editor */}
            <div className="flex-1 flex flex-col border-r border-[var(--border)]">
              <div className="px-4 py-2 border-b border-[var(--border)] flex items-center justify-between">
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="bg-[var(--surface-elevated)] text-[var(--foreground)] text-sm border-none rounded-md px-2 py-1 outline-none"
                >
                  {languages.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <Button size="sm" onClick={handleSubmit}>
                  End Interview
                </Button>
              </div>
              {submitError && (
                <div className="px-4 pt-3">
                  <ErrorBanner message={submitError} onRetry={handleSubmit} />
                </div>
              )}
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={language}
                  value={code}
                  onChange={v => setCode(v || "")}
                  theme={bwMode ? "light" : "vs-dark"}
                  options={{ fontSize: 14, minimap: { enabled: false }, padding: { top: 16 } }}
                />
              </div>
            </div>

            {/* Chat panel */}
            <div className="w-[380px] flex flex-col bg-[var(--background)]">
              <div className="px-4 py-2 border-b border-[var(--border)]">
                <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-widest font-semibold">AI Interviewer</p>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {chatLog.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "candidate" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                      msg.role === "candidate"
                        ? "bg-teal-600 text-white"
                        : "bg-[var(--surface-elevated)] text-[var(--foreground)]"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {asking && (
                  <div className="flex justify-start">
                    <div className="bg-[var(--surface-elevated)] text-[var(--muted-foreground)] px-3 py-2 rounded-xl text-sm">…thinking</div>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-[var(--border)]">
                <div className="flex gap-2">
                  <input
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAsk()}
                    placeholder="Explain your approach…"
                    className="flex-1 bg-[var(--surface)] border border-[var(--border-strong)] rounded-xl px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-teal-500/50"
                  />
                  <Button
                    size="sm"
                    onClick={handleAsk}
                    disabled={asking || !userInput.trim()}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}