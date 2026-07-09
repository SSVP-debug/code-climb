import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function FilterBar({ filters, onChange }) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <input placeholder="College domain (e.g. marwadiuniversity.ac.in)"
        value={filters.college} onChange={e => onChange("college", e.target.value)}
        className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-green-500/50 w-72" />
      <input placeholder="Topic (e.g. Dynamic Programming)"
        value={filters.topic} onChange={e => onChange("topic", e.target.value)}
        className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-green-500/50 w-56" />
      <input type="number" placeholder="Min solved" value={filters.minSolved}
        onChange={e => onChange("minSolved", e.target.value)}
        className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none w-28" />
    </div>
  );
}

function SendTestModal({ candidate, onClose, onSent }) {
  const [slugs, setSlugs] = useState("");
  const [duration, setDuration] = useState(90);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    const problemSlugs = slugs.split(",").map(s => s.trim()).filter(Boolean);
    const data = await apiFetch("/api/recruiter/skills-test", {
      method: "POST",
      body: JSON.stringify({ candidateUsername: candidate.username, problemSlugs, durationMinutes: duration, note }),
    });
    setLoading(false);
    if (data.error) return alert(data.error);
    onSent();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-1">Send Skills Test</h3>
        <p className="text-zinc-500 text-sm mb-4">To: {candidate.displayName} ({candidate.username})</p>
        <div className="space-y-3">
          <textarea value={slugs} onChange={e => setSlugs(e.target.value)} rows={2}
            placeholder="Problem slugs, comma-separated (e.g. two-sum, valid-parentheses)"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none" />
          <div className="flex gap-3">
            <input type="number" value={duration} onChange={e => setDuration(e.target.value)}
              placeholder="Duration (minutes)" className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none" />
          </div>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note to candidate"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white outline-none" />
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm bg-zinc-800 text-zinc-400">Cancel</button>
          <button onClick={send} disabled={loading || !slugs}
            className="flex-1 py-2 rounded-xl text-sm bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold">
            {loading ? "Sending…" : "Send Test"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RecruiterDashboardPage() {
  const [candidates, setCandidates] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ college: "", topic: "", minSolved: "" });
  const [selected, setSelected] = useState(null);
  const [pendingVerification, setPendingVerification] = useState(false);

  async function fetchCandidates(p = 1) {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: p,
        limit: 20,
      });

      if (filters.college) params.set("college", filters.college);
      if (filters.topic) params.set("topic", filters.topic);
      if (filters.minSolved) params.set("minSolved", filters.minSolved);

      const data = await apiFetch(`/api/recruiter/candidates?${params}`);

      setCandidates(data.candidates || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch (err) {
      if (
        err.message ===
        "Your recruiter account is pending verification."
      ) {
        setPendingVerification(true);
        return;
      }

      throw err;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCandidates(1); }, []);

  function updateFilter(k, v) { setFilters(f => ({ ...f, [k]: v })); }

  if (pendingVerification) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="max-w-lg text-center">
          <h1 className="text-3xl font-black text-white">
            Recruiter Verification Pending
          </h1>

          <p className="mt-4 text-zinc-400">
            Your recruiter account has been created successfully.
          </p>

          <p className="text-zinc-500">
            Access will be enabled after an administrator verifies your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">Candidate Search</h1>
          <p className="text-zinc-500 text-sm">{total} candidates found</p>
        </div>

        <FilterBar filters={filters} onChange={updateFilter} />
        <button onClick={() => fetchCandidates(1)}
          className="mb-6 px-5 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition">
          Search
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-6 px-4 py-2 border-b border-zinc-800 text-[10px] text-zinc-600 uppercase tracking-widest">
              <span className="col-span-2">Candidate</span>
              <span className="text-center">Solved</span>
              <span className="text-center">Hard</span>
              <span className="text-center">Verified</span>
              <span className="text-right">Action</span>
            </div>
            {candidates.length === 0 ? (
              <p className="text-center text-zinc-600 py-12 text-sm">No candidates match your filters.</p>
            ) : candidates.map(c => (
              <div key={c.username} className="grid grid-cols-6 items-center px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <div className="col-span-2">
                  <p className="text-sm text-white font-medium">{c.displayName}</p>
                  <p className="text-xs text-zinc-500">{c.college || "—"}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {c.topTopics.map(t => (
                      <span key={t} className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">{t}</span>
                    ))}
                  </div>
                </div>
                <span className="text-center text-sm text-green-400 font-semibold">{c.solvedCount}</span>
                <span className="text-center text-sm text-red-400">{c.hard}</span>
                <span className="text-center">{c.isVerified ? "✅" : "—"}</span>
                <div className="text-right flex gap-2 justify-end">
                  <a href={`/u/${c.username}`} target="_blank" rel="noreferrer"
                    className="px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition">
                    View
                  </a>
                  <button onClick={() => setSelected(c)}
                    className="px-3 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded-lg transition">
                    Test
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {total > 20 && (
          <div className="flex justify-center gap-3 mt-6">
            <button onClick={() => fetchCandidates(page - 1)} disabled={page === 1}
              className="px-4 py-2 text-sm bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl disabled:opacity-40">← Prev</button>
            <span className="text-sm text-zinc-500 py-2">Page {page}</span>
            <button onClick={() => fetchCandidates(page + 1)} disabled={candidates.length < 20}
              className="px-4 py-2 text-sm bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>
      {selected && <SendTestModal candidate={selected} onClose={() => setSelected(null)} onSent={() => { }} />}
    </div>
  );
}
