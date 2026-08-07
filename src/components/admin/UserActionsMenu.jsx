import { useState } from "react";
import { MoreVertical, Ban, CheckCircle2, Trash2, RotateCcw, UserCog } from "lucide-react";
import ConfirmDialog from "../ui/ConfirmDialog";

// Never offers "admin" as a target — enforced here in the UI (no admin
// option ever rendered) AND server-side in adminController.js's
// changeUserRole (400s on any other value) per plan 003's scope: this
// action must not become a backdoor to mint a second admin.
const ROLE_OPTIONS = ["student", "recruiter", "tpo"];

/**
 * UserActionsMenu — per-row dropdown for the five plan-003 management
 * actions (suspend/activate/delete/reset progress/change role). Delete and
 * reset-progress are irreversible/high-impact, so both route through
 * ConfirmDialog before firing; the other three are single-click.
 */
function UserActionsMenu({ user, busy, onSuspend, onActivate, onDelete, onResetProgress, onChangeRole }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(null); // "delete" | "reset-progress" | null
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  function closeAll() {
    setOpen(false);
    setRoleMenuOpen(false);
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label="User actions"
        disabled={Boolean(busy)}
        onClick={() => setOpen((o) => !o)}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-40"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={closeAll} role="presentation" />
          <div className="absolute right-0 mt-1 w-48 bg-zinc-950 border border-zinc-800 rounded-xl shadow-xl z-20 py-1 text-sm">
            {user.status === "suspended" ? (
              <button
                type="button"
                onClick={() => {
                  closeAll();
                  onActivate(user.id);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-zinc-200 hover:bg-zinc-900"
              >
                <CheckCircle2 size={14} /> Activate
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  closeAll();
                  onSuspend(user.id);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-zinc-200 hover:bg-zinc-900"
              >
                <Ban size={14} /> Suspend
              </button>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleMenuOpen((r) => !r)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-zinc-200 hover:bg-zinc-900"
              >
                <UserCog size={14} /> Change role
              </button>
              {roleMenuOpen && (
                <div className="pl-8 pb-1">
                  {ROLE_OPTIONS.filter((r) => r !== user.role).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        closeAll();
                        onChangeRole(user.id, r);
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-zinc-400 hover:text-white rounded"
                    >
                      → {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirming("reset-progress");
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-zinc-200 hover:bg-zinc-900"
            >
              <RotateCcw size={14} /> Reset progress
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirming("delete");
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-400 hover:bg-red-500/10"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </>
      )}

      {confirming === "delete" && (
        <ConfirmDialog
          title="Delete this user?"
          description="This permanently deletes the account and their submissions/notifications. This cannot be undone."
          confirmLabel="Delete"
          destructive
          loading={busy === "delete"}
          onConfirm={() => {
            onDelete(user.id);
            setConfirming(null);
          }}
          onCancel={() => setConfirming(null)}
        />
      )}

      {confirming === "reset-progress" && (
        <ConfirmDialog
          title="Reset this user's progress?"
          description="Clears their XP, streaks, solved problems, and achievements. Their role, verification status, and college/education info are untouched. This cannot be undone."
          confirmLabel="Reset progress"
          destructive
          loading={busy === "reset-progress"}
          onConfirm={() => {
            onResetProgress(user.id);
            setConfirming(null);
          }}
          onCancel={() => setConfirming(null)}
        />
      )}
    </div>
  );
}

export default UserActionsMenu;