import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { WORKSPACES } from "../config/workspaces";

/**
 * WorkspaceSwitcher — admin-only. Shows the current workspace ("Command
 * Center" by default, since an admin lands on /admin) and opens a menu to
 * jump into any of the four workspaces. Not rendered for any other role —
 * they have exactly one workspace and no concept of switching.
 */
function WorkspaceSwitcher({ currentId }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const current = WORKSPACES.find((w) => w.id === currentId) ?? WORKSPACES[0];

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }

    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Switch workspace"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-[10px] text-zinc-500 uppercase tracking-widest hover:text-zinc-300 transition"
      >
        {current.label}
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path
            d="M2 3.5L5 6.5L8 3.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Workspaces"
          className="absolute left-0 top-full mt-2 w-44 rounded-xl bg-zinc-900 border border-zinc-800 shadow-lg py-1 z-50"
        >
          {WORKSPACES.map((ws) => (
            <button
              key={ws.id}
              type="button"
              role="menuitemradio"
              aria-checked={ws.id === current.id}
              onClick={() => {
                setOpen(false);
                navigate(ws.path);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition ${
                ws.id === current.id
                  ? "text-white font-medium bg-zinc-800"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {ws.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default WorkspaceSwitcher;
