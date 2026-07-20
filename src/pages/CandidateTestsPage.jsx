import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";
import Button from "../components/ui/Button";
import { ClipboardList } from "lucide-react";

const STATUS_STYLES = {
  pending:     "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  submitted:   "bg-green-500/10 text-green-400 border-green-500/20",
  expired:     "bg-zinc-800 text-zinc-500 border-zinc-700",
};

function formatTimeLeft(expiresAt) {
  const ms = new Date(expiresAt) - Date.now();
  if (ms <= 0) return "Expired";
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m left` : `${m}m left`;
}

export default function CandidateTestsPage() {
  const navigate = useNavigate();
  const [tests, setTests]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    apiFetch("/api/candidate/tests")
      .then(d => { setTests(d.tests || []); setLoading(false); });
  }, []);

  async function startTest(testId) {
    setStarting(testId);
    const data = await apiFetch(`/api/candidate/tests/${testId}/start`, { method: "POST" });
    setStarting(null);
    if (data.error) {
      toast.error(data.error);
      return;
    }
    navigate(`/candidate/tests/${testId}`);
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-black text-white mb-2">Skills Tests</h1>
        <p className="text-zinc-500 text-sm mb-8">Tests sent to you by recruiters. Complete before the deadline.</p>

        {tests.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">
            <ClipboardList size={36} strokeWidth={1.75} className="mx-auto mb-3" aria-hidden="true" />
            <p>No tests yet. Keep your profile public to get noticed by recruiters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tests.map(t => (
              <div key={t._id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-semibold">{t.recruiterCompany || "Company"} Skills Test</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{t.problemSlugs.length} problems · {t.durationMs / 60000} minutes</p>
                    {t.note && <p className="text-zinc-400 text-sm mt-1 italic">"{t.note}"</p>}
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${STATUS_STYLES[t.status]}`}>
                    {t.status.replace("_", " ")}
                  </span>
                </div>

                {t.status === "submitted" && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${t.score}%` }} />
                    </div>
                    <span className="text-green-400 text-sm font-bold">{t.score}%</span>
                  </div>
                )}

                {t.status === "in_progress" && t.expiresAt && (
                  <p className="text-orange-400 text-xs mb-3">⏱ {formatTimeLeft(t.expiresAt)}</p>
                )}

                <div className="flex gap-2">
                  {t.status === "pending" && (
                    <Button onClick={() => startTest(t._id)} disabled={starting === t._id} loading={starting === t._id}>
                      {starting === t._id ? "Starting…" : "Start Test"}
                    </Button>
                  )}
                  {t.status === "in_progress" && (
                    <button onClick={() => navigate(`/candidate/tests/${t._id}`)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition">
                      Continue Test
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}