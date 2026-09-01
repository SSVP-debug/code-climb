import { ListChecks, Lock, Trash2 } from "lucide-react";

function PlaylistCard({ playlist, onOpen, onDelete }) {
  const progress =
    playlist.problemCount > 0
      ? Math.round((playlist.solvedCount / playlist.problemCount) * 100)
      : 0;

  return (
    <div
      onClick={() => onOpen(playlist)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen(playlist)}
      className="text-left bg-[var(--surface-elevated)] border border-[var(--border-strong)] rounded-xl p-4 hover:border-[var(--theme-primary,#2dd4bf)]/50 transition cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <ListChecks size={16} strokeWidth={2} className="text-[var(--theme-primary,#2dd4bf)] flex-shrink-0" />
          <h3 className="font-semibold text-sm truncate text-[var(--foreground)]">{playlist.name}</h3>
        </div>
        {playlist.isOfficial ? (
          <span title="Official playlist" className="flex-shrink-0">
            <Lock size={13} strokeWidth={2} className="text-[var(--muted-foreground)]" />
          </span>
        ) : (
          onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(playlist);
              }}
              className="flex-shrink-0 text-[var(--muted-foreground)] hover:text-red-400 transition opacity-0 group-hover:opacity-100"
              title="Delete playlist"
            >
              <Trash2 size={14} strokeWidth={2} />
            </button>
          )
        )}
      </div>

      {playlist.description && (
        <p className="text-xs text-[var(--muted-foreground)] mb-3 line-clamp-2">{playlist.description}</p>
      )}

      <div className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)] mb-1.5">
        <span>{playlist.problemCount} problem{playlist.problemCount === 1 ? "" : "s"}</span>
        <span className="tabular-nums">{playlist.solvedCount}/{playlist.problemCount} solved</span>
      </div>
      <div className="h-1.5 bg-[var(--surface)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--theme-primary,#2dd4bf)] rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default PlaylistCard;