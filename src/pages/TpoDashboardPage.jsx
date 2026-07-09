import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "../services/api";
import PageMeta from "../components/seo/PageMeta";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function StatCard({ label, value, accent = "text-white" }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <p className={`text-3xl font-black ${accent}`}>{value}</p>
      <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}

function ReadinessGauge({ score }) {
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  const label = score >= 70 ? "Placement Ready" : score >= 40 ? "Building Momentum" : "Needs Attention";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center gap-6">
      <div className="relative w-24 h-24 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#27272a" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${(score / 100) * 264} 264`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-black text-white">{score}</span>
        </div>
      </div>
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1">
          Placement Readiness Score
        </p>
        <p className="text-lg font-bold" style={{ color }}>{label}</p>
        <p className="text-xs text-zinc-600 mt-1">Based on solve volume, hard-problem coverage, and weekly engagement.</p>
      </div>
    </div>
  );
}

function CreateAssignmentModal({ onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [slugsText, setSlugsText] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    const problemSlugs = slugsText.split(",").map(s => s.trim()).filter(Boolean);
    if (!title || problemSlugs.length === 0 || !dueDate) return;

    setSaving(true);
    try {
      await apiFetch("/api/tpo/assignments", {
        method: "POST",
        body: JSON.stringify({ title, problemSlugs, dueDate }),
      });
      onCreated();
      onClose();
    } catch {
      alert("Failed to create assignment.");
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-4">New Assignment</h3>
        <div className="space-y-3">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Assignment title (e.g. Week 3 — Arrays)"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-green-500/50"
          />
          <textarea
            value={slugsText}
            onChange={e => setSlugsText(e.target.value)}
            placeholder="Problem slugs, comma-separated (e.g. two-sum, valid-parentheses)"
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-green-500/50"
          />
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-green-500/50"
          />
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm bg-zinc-800 text-zinc-400 hover:text-white transition">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !title || !slugsText || !dueDate}
            className="flex-1 py-2 rounded-xl text-sm bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold transition"
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TpoDashboardPage() {
  const [enabled, setEnabled] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [showModal, setShowModal] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [dash, stu, asn] = await Promise.all([
        apiFetch("/api/tpo/dashboard"),
        apiFetch("/api/tpo/students"),
        apiFetch("/api/tpo/assignments"),
      ]);

      if (dash.enabled === false) {
        setEnabled(false);
        setLoading(false);
        return;
      }

      setEnabled(true);
      setDashboard(dash);
      setStudents(stu.students || []);
      setAssignments(asn.assignments || []);
    } catch (err) {
      if (
        err.message ===
        "Your TPO account is pending verification."
      ) {
        setPendingVerification(true);
        return;
      }

      setEnabled(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function downloadReportPDF() {
    import("../services/auth").then(({ getIdToken }) => {
      getIdToken().then(token => {
        fetch(`${API_URL}/api/tpo/report/pdf`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.blob())
          .then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "codeclub_class_report.pdf"; a.click();
            URL.revokeObjectURL(url);
          });
      });
    });
  }

  if (pendingVerification) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="max-w-lg text-center">
          <h1 className="text-3xl font-black text-white">
            College Verification Pending
          </h1>

          <p className="mt-4 text-zinc-400">
            Your college registration request has been submitted successfully.
          </p>

          <p className="text-zinc-500">
            Access will be enabled after an administrator verifies your institution.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (enabled === false) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🎓</div>
          <h1 className="text-2xl font-bold text-white mb-3">College Dashboard Coming Soon</h1>
          <p className="text-zinc-400 text-sm">
            We're rolling out the College Admin dashboard gradually. Reach out to
            hello@codeclub.in to get early access for your institution.
          </p>
        </div>
      </div>
    );
  }

  if (!dashboard || dashboard.totalStudents === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">👋</div>
          <h1 className="text-2xl font-bold text-white mb-3">No students yet</h1>
          <p className="text-zinc-400 text-sm">
            Once students from {dashboard?.domain || "your college"} sign up with their
            institutional email, you'll see their stats here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <PageMeta title="College Dashboard · Code Club" path="/tpo/dashboard" />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">{dashboard.college}</h1>
            <p className="text-zinc-500 text-sm">{dashboard.domain} · {dashboard.totalStudents} students</p>
          </div>
          <button
            onClick={downloadReportPDF}
            className="px-4 py-2 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white rounded-xl text-sm font-medium transition"
          >
            ⬇ Download Report
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {["overview", "students", "assignments"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition ${tab === t ? "bg-green-600 text-white" : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="space-y-6">
            <ReadinessGauge score={dashboard.readinessScore} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Avg Solved/Student" value={dashboard.avgSolved} accent="text-green-400" />
              <StatCard label="Active This Week" value={`${dashboard.activePercent}%`} accent="text-orange-400" />
              <StatCard label="Total Solves" value={dashboard.totalSolved} />
              <StatCard label="Hard Problems Solved" value={dashboard.difficultyBreakdown.hard} accent="text-red-400" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">Topic Coverage</h3>
              <div className="space-y-2">
                {dashboard.topicCoverage.map(t => (
                  <div key={t.topic} className="flex items-center gap-3">
                    <span className="text-sm text-zinc-300 w-40 truncate">{t.topic}</span>
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${Math.min(100, (t.totalSolves / dashboard.topicCoverage[0].totalSolves) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500 w-10 text-right">{t.totalSolves}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "students" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-2 border-b border-zinc-800 text-[10px] text-zinc-600 uppercase tracking-widest">
              <span className="flex-1">Student</span>
              <span className="w-20 text-right">Solved</span>
              <span className="w-20 text-right">Streak</span>
              <span className="w-20 text-right">XP</span>
            </div>
            <div className="divide-y divide-zinc-800/50 max-h-[600px] overflow-y-auto">
              {students
                .sort((a, b) => b.totalXP - a.totalXP)
                .map(s => (
                  <div key={s.email} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/30">
                    <span className="flex-1 text-sm text-white truncate">{s.name}</span>
                    <span className="w-20 text-right text-sm text-zinc-400">{s.solvedCount}</span>
                    <span className="w-20 text-right text-sm text-orange-400">{s.currentStreak > 0 ? `🔥${s.currentStreak}` : "—"}</span>
                    <span className="w-20 text-right text-sm text-green-400 font-semibold">{s.totalXP}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {tab === "assignments" && (
          <div>
            <button
              onClick={() => setShowModal(true)}
              className="mb-4 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition"
            >
              + New Assignment
            </button>
            <div className="space-y-3">
              {assignments.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-12">No assignments yet. Create one above.</p>
              ) : (
                assignments.map(a => (
                  <div key={a._id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white">{a.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${a.isOverdue ? "bg-red-500/10 text-red-400" : "bg-zinc-800 text-zinc-400"
                        }`}>
                        Due {new Date(a.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mb-3">{a.problemSlugs.length} problems</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${a.completionPercent}%` }} />
                      </div>
                      <span className="text-xs text-zinc-500">{a.completedCount}/{a.totalStudents} done</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <CreateAssignmentModal onClose={() => setShowModal(false)} onCreated={fetchAll} />
      )}
    </div>
  );
}
