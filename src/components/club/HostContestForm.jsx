import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { apiFetch } from "../../services/api";
import { useProblems } from "../../hooks/useProblems";
import Button from "../ui/Button";
import { Search, Check, Copy, ExternalLink } from "lucide-react";

const DURATION_OPTIONS = [
  { label: "30 minutes", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "3 hours", minutes: 180 },
  { label: "4 hours", minutes: 240 },
];

const MAX_PROBLEMS = 8;
const DIFF_DOT = { Easy: "bg-green-400", Medium: "bg-yellow-400", Hard: "bg-red-400" };

function toLocalInputValue(date) {
  // datetime-local wants "YYYY-MM-DDTHH:mm" in local time, not UTC ISO
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * HostContestForm — Phase 12B. Real submission to POST /api/contests/private
 * (now open to verified... eventually verified, see backend comment) students
 * with the confirmed guardrails: max 8 problems, max 100 participants,
 * 30min–4hr duration, one active hosted contest at a time.
 */
export default function HostContestForm() {
  const navigate = useNavigate();
  const { problems, loading: problemsLoading } = useProblems();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState(() => {
    const in15 = new Date(Date.now() + 15 * 60 * 1000);
    return toLocalInputValue(in15);
  });
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [maxParticipants, setMaxParticipants] = useState(20);
  const [allowLateJoin, setAllowLateJoin] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedSlugs, setSelectedSlugs] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null); // { inviteCode, _id, title }

  const filteredProblems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return problems.slice(0, 30);
    return problems.filter((p) => p.title.toLowerCase().includes(q)).slice(0, 30);
  }, [problems, search]);

  function toggleSlug(slug) {
    setSelectedSlugs((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX_PROBLEMS) {
        toast.error(`You can select at most ${MAX_PROBLEMS} problems.`);
        return prev;
      }
      return [...prev, slug];
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return toast.error("Give your contest a title.");
    if (selectedSlugs.length === 0) return toast.error("Select at least one problem.");

    const start = new Date(startsAt);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    setSubmitting(true);
    try {
      const data = await apiFetch("/api/contests/private", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          problemSlugs: selectedSlugs,
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          maxParticipants,
          allowLateJoin,
        }),
      });
      setCreated(data);
    } catch (err) {
      toast.error(err.message || "Failed to create contest.");
    }
    setSubmitting(false);
  }

  function copy(text, label) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  // ── Success state — invite code + share link ────────────────────────────
  if (created) {
    const shareLink = `${window.location.origin}/club/private-contests?code=${created.inviteCode}`;
    return (
      <div className="text-center py-4">
        <p className="text-zinc-400 text-sm mb-1">Your contest is ready</p>
        <h3 className="text-xl font-bold mb-6">{created.title}</h3>

        <div className="bg-zinc-800 rounded-2xl p-6 mb-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Invite Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-mono font-black tracking-widest">{created.inviteCode}</span>
            <button
              onClick={() => copy(created.inviteCode, "Code")}
              className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition"
              title="Copy code"
            >
              <Copy size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => copy(shareLink, "Invite link")} variant="secondary" className="flex-1">
            Copy Invite Link
          </Button>
          <Button
            onClick={() => navigate(`/club/public-contests/${created._id}`)}
            variant="theme"
            className="flex-1"
          >
            <ExternalLink size={14} aria-hidden="true" /> View Contest
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-widest">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Friday Night DSA Sprint"
          maxLength={80}
          className="w-full mt-1.5 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
        />
      </div>

      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-widest">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this contest about?"
          maxLength={300}
          rows={2}
          className="w-full mt-1.5 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[var(--theme-primary,#2dd4bf)] resize-none"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-widest">Starts at</label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full mt-1.5 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-widest">Duration</label>
          <select
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="w-full mt-1.5 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
          >
            {DURATION_OPTIONS.map((d) => (
              <option key={d.minutes} value={d.minutes}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-widest">
          Max participants (2–100)
        </label>
        <input
          type="number"
          min={2}
          max={100}
          value={maxParticipants}
          onChange={(e) => setMaxParticipants(Math.min(100, Math.max(2, Number(e.target.value) || 2)))}
          className="w-full mt-1.5 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
        />
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={allowLateJoin}
          onChange={(e) => setAllowLateJoin(e.target.checked)}
          className="w-4 h-4 accent-[var(--theme-primary,#2dd4bf)]"
        />
        <span className="text-sm text-zinc-300">Allow people to join after it starts</span>
      </label>

      {/* Problem picker */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-zinc-500 uppercase tracking-widest">
            Problems ({selectedSlugs.length}/{MAX_PROBLEMS})
          </label>
        </div>
        <div className="relative mb-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems…"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
          />
        </div>

        <div className="max-h-56 overflow-y-auto border border-zinc-800 rounded-xl divide-y divide-zinc-800/60">
          {problemsLoading ? (
            <p className="text-zinc-600 text-sm text-center py-6">Loading problems…</p>
          ) : filteredProblems.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-6">No problems match "{search}".</p>
          ) : (
            filteredProblems.map((p) => {
              const checked = selectedSlugs.includes(p.slug);
              return (
                <button
                  type="button"
                  key={p.slug}
                  onClick={() => toggleSlug(p.slug)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-zinc-800/60 transition"
                >
                  <span
                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border"
                    style={
                      checked
                        ? { backgroundColor: "var(--theme-primary,#2dd4bf)", borderColor: "var(--theme-primary,#2dd4bf)" }
                        : { borderColor: "#3f3f46" }
                    }
                  >
                    {checked && <Check size={11} strokeWidth={3} className="text-black" aria-hidden="true" />}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${DIFF_DOT[p.difficulty] ?? "bg-zinc-600"}`} aria-hidden="true" />
                  <span className="text-sm text-zinc-200 truncate">{p.title}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <Button type="submit" variant="theme" disabled={submitting} loading={submitting} className="w-full">
        {submitting ? "Creating…" : "Create Contest"}
      </Button>
    </form>
  );
}