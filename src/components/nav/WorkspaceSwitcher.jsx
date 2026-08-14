import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Check } from "lucide-react";
import { WORKSPACES, getWorkspace } from "../../config/workspaces";

/**
 * WorkspaceSwitcher — Navbar transformation, Phase A.
 *
 * Admin-only, deliberately. `role` on the backend User model is a single
 * string, not a `roles[]` array — there is no real concept today of a
 * student or recruiter account holding multiple accessible workspaces.
 * Admin is the one role that already had standing cross-workspace links
 * (the old plain Student/Recruiter/TPO `secondary` list in Navbar), so
 * this replaces that list with a proper popover rather than inventing a
 * "your workspaces" picker for accounts that only ever have one. If
 * multi-role accounts ever become real, this is the one place that needs
 * to change — every workspace's identity already lives in
 * src/config/workspaces.js.
 *
 * Interaction pattern (click-outside, Escape, roving highlight) mirrors
 * AvatarDropdown and CommandPalette, the two existing popovers in this
 * codebase, rather than introducing a third convention.
 */
export default function WorkspaceSwitcher({ activeRole }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const current = getWorkspace(activeRole);

  // Event handler, not an effect — safe to pair setStates here (same
  // convention CommandPalette's handleQueryChange uses). Resets the
  // keyboard highlight to the current workspace each time the menu opens.
  function handleToggle() {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        const currentIndex = WORKSPACES.findIndex((w) => w.role === activeRole);
        setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
      }
      return next;
    });
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function go(ws) {
    setOpen(false);
    navigate(ws.to);
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, WORKSPACES.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(WORKSPACES[activeIndex]);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Switch workspace"
        className="flex items-center gap-1 text-[10px] text-zinc-500 uppercase tracking-widest hover:text-zinc-300 transition"
      >
        {current.label}
        <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Workspaces"
          onKeyDown={handleKeyDown}
          className="absolute left-0 mt-3 w-64 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl overflow-hidden z-50"
        >
          <p className="px-4 pt-3 pb-2 text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">
            Workspaces
          </p>
          <div className="pb-2">
            {WORKSPACES.map((ws, i) => {
              const isActiveWorkspace = ws.role === activeRole;
              const isHighlighted = i === activeIndex;
              return (
                <button
                  key={ws.role}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActiveWorkspace}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => go(ws)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition ${
                    isHighlighted ? "bg-zinc-800/80" : "hover:bg-zinc-800/50"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      isActiveWorkspace ? "bg-[var(--theme-primary,#2dd4bf)]" : "bg-zinc-700"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-white truncate">{ws.label}</span>
                    <span className="block text-[11px] text-zinc-500 truncate">{ws.tagline}</span>
                  </span>
                  {isActiveWorkspace && <Check size={13} className="text-zinc-500 shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
