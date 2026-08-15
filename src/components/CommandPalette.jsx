import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * CommandPalette — a lightweight "jump to" dialog opened from Navbar's
 * search trigger. `destinations` is the same role-appropriate nav list
 * Navbar already computes (nav.primary + nav.secondary), so a recruiter
 * only ever sees recruiter destinations, a student only student ones, etc.
 * Not offered to admins — the WorkspaceSwitcher already covers "go
 * somewhere else" for that role.
 */
function CommandPalette({ destinations, onClose }) {
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 flex items-start justify-center pt-24 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Command palette"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-2"
      >
        <p className="px-3 py-2 text-xs text-zinc-500 uppercase tracking-widest">
          Go to
        </p>
        <div className="flex flex-col">
          {destinations.map((d) => (
            <button
              key={d.to}
              type="button"
              onClick={() => {
                onClose();
                navigate(d.to);
              }}
              className="text-left px-3 py-2.5 rounded-xl text-sm text-zinc-200 hover:bg-zinc-800 transition"
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
