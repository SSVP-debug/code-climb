import { useState } from "react";
import toast from "react-hot-toast";
import { ListChecks, Plus } from "lucide-react";
import SectionCard from "../../ui/layout/SectionCard";
import EmptyState from "../../ui/feedback/EmptyState";
import { usePlaylists } from "../../../hooks/usePlaylists";
import PlaylistCard from "./PlaylistCard";
import CreatePlaylistModal from "./CreatePlaylistModal";
import PlaylistDetailModal from "./PlaylistDetailModal";

/**
 * PlaylistView
 *
 * Curated problem collections — a handful of official ones (seeded via
 * backend/scripts/seedPlaylists.js) plus user-created custom playlists.
 * Self-sufficient like SavedView: owns its own data via usePlaylists()
 * rather than being prop-fed by ProblemsPage.
 */
function PlaylistView() {
  const { playlists, loading, createPlaylist, updatePlaylist, deletePlaylist } = usePlaylists();
  const [createOpen, setCreateOpen] = useState(false);
  const [activePlaylist, setActivePlaylist] = useState(null);

  async function handleCreate(payload) {
    const created = await createPlaylist(payload);
    toast.success(`"${created.name}" created`);
  }

  async function handleDelete(playlist) {
    if (!window.confirm(`Delete "${playlist.name}"? This can't be undone.`)) return;
    try {
      await deletePlaylist(playlist.id);
      toast.success(`"${playlist.name}" deleted`);
    } catch (err) {
      toast.error(err.message || "Failed to delete playlist");
    }
  }

  // Keep the open detail modal's data in sync with the list (e.g. after a
  // reorder/remove persists) instead of it holding a stale snapshot.
  const liveActivePlaylist = activePlaylist
    ? playlists.find((p) => p.id === activePlaylist.id) || null
    : null;

  return (
    <SectionCard
      title="Playlists"
      subtitle="Curated learning collections."
      icon={<ListChecks size={18} strokeWidth={2} />}
      accented
      action={
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--theme-primary,#2dd4bf)] text-[#09090b] hover:brightness-110 transition"
        >
          <Plus size={14} strokeWidth={2.5} aria-hidden="true" />
          New Playlist
        </button>
      }
    >
      {loading ? (
        <p className="text-zinc-500 text-sm py-4">Loading playlists…</p>
      ) : playlists.length === 0 ? (
        <EmptyState
          icon={<ListChecks size={28} strokeWidth={1.75} />}
          title="No playlists yet"
          description="Create a custom playlist to group problems your way — interview prep, weak topics, whatever helps you study."
          actionLabel="New Playlist"
          onAction={() => setCreateOpen(true)}
          compact
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {playlists.map((p) => (
            <PlaylistCard
              key={p.id}
              playlist={p}
              onOpen={setActivePlaylist}
              onDelete={p.isOfficial ? null : handleDelete}
            />
          ))}
        </div>
      )}

      {createOpen && (
        <CreatePlaylistModal
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreate}
        />
      )}

      {liveActivePlaylist && (
        <PlaylistDetailModal
          playlist={liveActivePlaylist}
          onClose={() => setActivePlaylist(null)}
          onUpdate={updatePlaylist}
          onDelete={deletePlaylist}
        />
      )}
    </SectionCard>
  );
}

export default PlaylistView;