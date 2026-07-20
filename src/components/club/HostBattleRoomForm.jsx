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

/**
 * HostBattleRoomForm — Phase 12E. Creates the room in "lobby" state; the
 * host lands on the room's detail page afterward to assign teams and
 * start the match once people have joined via the invite code.
 */
export default function HostBattleRoomForm() {
  const navigate = useNavigate();
  const { problems, loading: problemsLoading } = useProblems();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [search, setSearch] = useState("");
  const [selectedSlugs, setSelectedSlugs] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

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
    if (!title.trim()) return toast.error("Give your Battle Room a title.");
    if (selectedSlugs.length === 0) return toast.error("Select at least one problem.");

    setSubmitting(true);
    try {
      const data = await apiFetch("/api/battle-rooms", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          problemSlugs: selectedSlugs,
          durationMinutes,
          maxTeamSize,
        }),
      });
      setCreated(data);
    } catch (err) {
      toast.error(err.message || "Failed to create Battle Room.");
    }
    setSubmitting(false);
  }

  function copy(text, label) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  if (created) {
    const shareLink = `${window.location.origin}/club/battle-rooms?code=${created.inviteCode}`;
    return (
      <div className="text-center py-4">
        <p className="text-zinc-400 text-sm mb-1">Your room is ready</p>
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

        <p className="text-zinc-500 text-xs mb-4">
          Share this code — once your teammates join, head into the room to assign teams and start the match.
        </p>

        <div className="flex gap-2">
          <Button onClick={() => copy(shareLink, "Invite link")} variant="secondary" className="flex-1">
            Copy Invite Link
          </Button>
          <Button
            onClick={() => navigate(`/club/battle-rooms/${created._id}`)}
            variant="theme"
            className="flex-1"
          >
            <ExternalLink size={14} aria-hidden="true" /> Enter Lobby
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
          placeholder="e.g. CS Club Showdown"
          maxLength={80}
          className="w-full mt-1.5 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
        />
      </div>

      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-widest">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this match about?"
          maxLength={300}
          rows={2}
          className="w-full mt-1.5 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[var(--theme-primary,#2dd4bf)] resize-none"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-widest">Match duration</label>
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
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-widest">Max players per team (2–6)</label>
          <input
            type="number"
            min={2}
            max={6}
            value={maxTeamSize}
            onChange={(e) => setMaxTeamSize(Math.min(6, Math.max(2, Number(e.target.value) || 2)))}
            className="w-full mt-1.5 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
          />
        </div>
      </div>

      {/* Problem picker — same pattern as HostContestForm */}
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
        {submitting ? "Creating…" : "Create Battle Room"}
      </Button>
    </form>
  );
}