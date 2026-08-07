import Button from "./Button";

/**
 * ConfirmDialog — generic yes/no confirmation modal.
 *
 * Checked src/components/ui/ before building this (plan 003's instruction):
 * every existing modal in the app (CollegeVerifyModal, LevelUpModal,
 * CreatePlaylistModal, etc.) is bespoke and feature-specific — there was no
 * shared confirm/dialog primitive to reuse. This is deliberately small and
 * generic so the next feature needing a "are you sure?" prompt (not just
 * plan 003's delete/reset-progress actions) can reuse it instead of rolling
 * its own overlay markup again.
 *
 * Overlay/backdrop convention matches CollegeVerifyModal.jsx
 * (`fixed inset-0 bg-black/70 ... onClick={onClose}`) for visual
 * consistency with the rest of the app's modals.
 */
export default function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <h2 id="confirm-dialog-title" className="text-white font-bold text-base mb-1.5">
          {title}
        </h2>
        {description && <p className="text-zinc-400 text-sm mb-5">{description}</p>}
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            variant={destructive ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}