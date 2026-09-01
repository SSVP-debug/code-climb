import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { X, ArrowUp, ArrowDown, Trash2, Lock, ArrowRight } from "lucide-react";
import { useProblems } from "../../../hooks/useProblems";
import { useAppContext } from "../../../hooks/useAppContext";

const DIFFICULTY_COLOR = {
  Easy: "text-green-400",
  Medium: "text-yellow-400",
  Hard: "text-red-400",
};

/**
 * PlaylistDetailModal
 *
 * Opened from a PlaylistCard. Official playlists render read-only
 * (problemSlugs is server-truth, no edit affordances). Owned playlists
 * support reordering (up/down — no drag library pulled in for this),
 * removing a problem, and deleting the whole playlist.
 */
function PlaylistDetailModal({ playlist, onClose, onUpdate, onDelete }) {
  const { problems } = useProblems();
  const { solvedProblems } = useAppContext();
  const [slugs, setSlugs] = useState(playlist.problemSlugs);
  const [saving, setSaving] = useState(false);

  const canEdit = !playlist.isOfficial;

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const problemsBySlug = useMemo(() => {
    const map = new Map();
    problems.forEach((p) => map.set(p.slug, p));
    return map;
  }, [problems]);

  const rows = slugs.map((slug) => problemsBySlug.get(slug)).filter(Boolean);
  const solvedCount = rows.filter((p) => solvedProblems.includes(p.slug)).length;

  async function persist(nextSlugs) {
    setSlugs(nextSlugs);
    setSaving(true);
    try {
      await onUpdate(playlist.id, { problemSlugs: nextSlugs });
    } catch (err) {
      toast.error(err.message || "Failed to update playlist");
      setSlugs(slugs); // revert on failure
    } finally {
      setSaving(false);
    }
  }

  function move(index, direction) {
    const next = [...slugs];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    persist(next);
  }

  function remove(slug) {
    persist(slugs.filter((s) => s !== slug));
  }

  async function handleDeletePlaylist() {
    if (!window.confirm(`Delete "${playlist.name}"? This can't be undone.`)) return;
    try {
      await onDelete(playlist.id);
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to delete playlist");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={playlist.name}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-[var(--border)]">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[var(--foreground)] truncate">{playlist.name}</h2>
              {playlist.isOfficial && (
                <span title="Official playlist"><Lock size={14} className="text-[var(--muted-foreground)] flex-shrink-0" /></span>
              )}
            </div>
            {playlist.description && (
              <p className="text-xs text-[var(--muted-foreground)] mt-1">{playlist.description}</p>
            )}
            <p className="text-xs text-[var(--muted-foreground)] mt-1 tabular-nums">
              {solvedCount}/{rows.length} solved
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {canEdit && (
              <button
                onClick={handleDeletePlaylist}
                className="p-1.5 hover:bg-[var(--surface-elevated)] rounded-lg text-[var(--muted-foreground)] hover:text-red-400 transition"
                title="Delete playlist"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[var(--surface-elevated)] rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-grow">
          {rows.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] text-center py-10">
              {canEdit ? "No problems yet — edit this playlist to add some." : "This playlist is empty."}
            </p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {rows.map((p, i) => (
                <div key={p.slug} className="flex items-center gap-3 px-5 py-3">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      solvedProblems.includes(p.slug) ? "bg-green-500" : "bg-[var(--border-strong)]"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="text-xs text-[var(--muted-foreground)] w-4 flex-shrink-0 tabular-nums">{i + 1}</span>
                  <Link
                    to={`/problems/${p.slug}`}
                    className="flex-grow min-w-0 text-sm truncate hover:text-[var(--theme-primary,#2dd4bf)] transition"
                  >
                    {p.title}
                  </Link>
                  <span className={`text-[11px] font-medium flex-shrink-0 ${DIFFICULTY_COLOR[p.difficulty] || "text-[var(--muted-foreground)]"}`}>
                    {p.difficulty}
                  </span>
                  {canEdit && (
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => move(i, -1)}
                        disabled={i === 0 || saving}
                        className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-30 transition"
                        title="Move up"
                      >
                        <ArrowUp size={13} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => move(i, 1)}
                        disabled={i === rows.length - 1 || saving}
                        className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-30 transition"
                        title="Move down"
                      >
                        <ArrowDown size={13} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => remove(p.slug)}
                        disabled={saving}
                        className="p-1 text-[var(--muted-foreground)] hover:text-red-400 disabled:opacity-30 transition"
                        title="Remove from playlist"
                      >
                        <X size={13} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                  {!canEdit && (
                    <Link
                      to={`/problems/${p.slug}`}
                      className="text-[var(--theme-primary,#2dd4bf)] flex-shrink-0"
                      title="Solve"
                    >
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlaylistDetailModal;