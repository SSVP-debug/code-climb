import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import DashboardLayout from "../layouts/DashboardLayout";
import { apiFetch } from "../services/api";
import PageMeta from "../components/seo/PageMeta";

function formatTime(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function InterviewModePage() {
  const { slug } = useParams();
  const navigate = useNavigate();

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

        if (data.error) {
          setError(data.error);
          setLoading(false);
          return;
        }

        setSession(data);
        setTimeLeft(data.durationMs);
        setChatLog([{
          role: "interviewer",
          text: `Let's begin. Tell me how you'd approach "${data.problem.title}" — what's your first instinct?`,
        }]);
      } catch (err) {
        setError(err.message || "Failed to start interview session.");
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
    setSubmitted(true);
    try {
      await apiFetch("/api/interview/submit", {
        method: "POST",
        body: JSON.stringify({ sessionId: session.sessionId }),
      });
    } catch {}
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center max-w-md">
            <h2 className="text-xl font-bold text-white mb-2">Interview Mode Unavailable</h2>
            <p className="text-zinc-400 text-sm mb-6">{error}</p>
            <button
              onClick={() => navigate(`/problems/${slug}`)}
              className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition"
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
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
          <div>
            <h1 className="text-lg font-bold text-white">{session?.problem?.title}</h1>
            <p className="text-xs text-zinc-500">Live Interview Mode · {session?.problem?.difficulty}</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg ${
            urgent ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-zinc-800 text-green-400"
          }`}>
            ⏱ {formatTime(timeLeft)}
          </div>
        </div>

        {submitted ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-zinc-900 border border-green-500/30 rounded-2xl p-8 text-center max-w-md">
              <h2 className="text-2xl font-bold text-white mb-2">Interview Complete</h2>
              <p className="text-zinc-400 text-sm mb-2">{chatLog.filter(c=>c.role==="interviewer").length} questions asked</p>
              <p className="text-zinc-500 text-xs mb-6">Time used: {formatTime(session.durationMs - timeLeft)}</p>
              <button
                onClick={() => navigate(`/problems/${slug}`)}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold transition"
              >
                Back to Problem
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Editor */}
            <div className="flex-1 flex flex-col border-r border-zinc-800">
              <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="bg-zinc-800 text-zinc-200 text-sm border-none rounded-md px-2 py-1 outline-none"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition"
                >
                  End Interview
                </button>
              </div>
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={language}
                  value={code}
                  onChange={v => setCode(v || "")}
                  theme="vs-dark"
                  options={{ fontSize: 14, minimap: { enabled: false }, padding: { top: 16 } }}
                />
              </div>
            </div>

            {/* Chat panel */}
            <div className="w-[380px] flex flex-col bg-zinc-950">
              <div className="px-4 py-2 border-b border-zinc-800">
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">AI Interviewer</p>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {chatLog.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "candidate" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                      msg.role === "candidate"
                        ? "bg-green-600 text-white"
                        : "bg-zinc-800 text-zinc-200"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {asking && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-800 text-zinc-500 px-3 py-2 rounded-xl text-sm">…thinking</div>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-zinc-800">
                <div className="flex gap-2">
                  <input
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAsk()}
                    placeholder="Explain your approach…"
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-green-500/50"
                  />
                  <button
                    onClick={handleAsk}
                    disabled={asking || !userInput.trim()}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
