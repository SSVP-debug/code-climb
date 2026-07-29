import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { X, Search, Check } from "lucide-react";
import { useProblems } from "../../../hooks/useProblems";

const DIFFICULTY_COLOR = {
  Easy: "text-green-400",
  Medium: "text-yellow-400",
  Hard: "text-red-400",
};

/**
 * CreatePlaylistModal
 *
 * Name + description + a searchable problem picker, reusing the same
 * search/filter shape PinnedProblems.jsx's picker already established
 * (search box over the full useProblems() catalog, toggle-to-select rows).
 */
function CreatePlaylistModal({ onClose, onCreate }) {
  const { problems } = useProblems();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]); // array of slugs, preserves add order
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return problems.slice(0, 50);
    return problems
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.topic?.toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [problems, search]);

  function toggle(slug) {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Give your playlist a name first.");
      return;
    }
    setCreating(true);
    try {
      await onCreate({ name: name.trim(), description: description.trim(), problemSlugs: selected });
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to create playlist");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Create playlist"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">New Playlist</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-grow">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Interview Prep — Week 1"
              maxLength={80}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Description <span className="text-zinc-600">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this collection for?"
              maxLength={300}
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--theme-primary,#2dd4bf)] resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-zinc-400">Add problems</label>
              <span className="text-xs text-zinc-500">{selected.length} selected</span>
            </div>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or topic…"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
              />
            </div>
            <div className="border border-zinc-800 rounded-lg max-h-56 overflow-y-auto custom-scrollbar divide-y divide-zinc-800">
              {filtered.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6">No problems match your search.</p>
              ) : (
                filtered.map((p) => {
                  const isSelected = selected.includes(p.slug);
                  return (
                    <button
                      key={p.slug}
                      type="button"
                      onClick={() => toggle(p.slug)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm transition ${
                        isSelected ? "bg-[var(--theme-primary,#2dd4bf)]/10" : "hover:bg-zinc-800"
                      }`}
                    >
                      <span className="truncate">{p.title}</span>
                      <span className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[11px] font-medium ${DIFFICULTY_COLOR[p.difficulty] || "text-zinc-500"}`}>
                          {p.difficulty}
                        </span>
                        {isSelected && (
                          <Check size={14} className="text-[var(--theme-primary,#2dd4bf)]" aria-hidden="true" />
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--theme-primary,#2dd4bf)] text-[#09090b] hover:brightness-110 transition disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create Playlist"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreatePlaylistModal;