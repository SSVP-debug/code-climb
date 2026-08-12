import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, CornerDownLeft } from "lucide-react";

/**
 * CommandPalette — spec §8/§18.
 *
 * Scope, deliberately: this indexes real destinations (every admin route
 * that actually exists — see AdminLayout's NAV_GROUPS) plus a small set of
 * real quick actions (jump to a queue anchor, force-refresh system health).
 * It does NOT pretend to full-text search users/problems/recruiters by
 * name — there is no backend search endpoint for that today (only list +
 * filter endpoints per-page, see useAdminUsers.js/useAdminProblems.js).
 * Wiring that up is a real backend feature, not a command-palette UI trick,
 * so it's left as a clearly-scoped follow-up rather than faked here.
 *
 * Mount lifecycle: AdminLayout only renders this component while open
 * ({paletteOpen && <CommandPalette .../>}), so every open is a fresh mount
 * with fresh useState defaults — no "reset internal state when a prop
 * flips" effect/ref juggling required.
 */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function CommandPalette({ onClose, commands }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  const navigate = useNavigate();

  // JARVIS pass, spec §21: trap focus inside the palette while open and
  // restore it to whatever opened the palette (search button / ⌘K target)
  // on close — same pattern as SideDrawer, so keyboard users never lose
  // their place behind the overlay.
  useEffect(() => {
    triggerRef.current = document.activeElement;
    return () => {
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus();
    };
  }, []);

  function handleTabTrap(e) {
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q) ||
        (c.keywords || "").toLowerCase().includes(q)
    );
  }, [query, commands]);

  // Pure side effect (imperative focus call) on mount, no setState involved.
  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  function handleQueryChange(value) {
    setQuery(value);
    setActiveIndex(0); // event handler, not an effect — safe to pair setStates here
  }

  function run(cmd) {
    if (!cmd) return;
    if (cmd.action) cmd.action();
    else if (cmd.to) navigate(cmd.to);
    onClose();
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(filtered[Math.min(activeIndex, filtered.length - 1)]);
    }
  }

  // Group filtered results for scannable sections, same "one array drives
  // render" convention as the rest of the admin codebase.
  const groups = [];
  for (const cmd of filtered) {
    let g = groups.find((x) => x.name === cmd.group);
    if (!g) {
      g = { name: cmd.group, items: [] };
      groups.push(g);
    }
    g.items.push(cmd);
  }

  // Clamp for display/keyboard purposes without storing a second copy of
  // state — filtered can shrink between renders (e.g. typing a stricter
  // query) and activeIndex just needs to stay in range.
  const safeActiveIndex = Math.min(activeIndex, filtered.length - 1);
  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={handleTabTrap}
        className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-ink-900/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden animate-fadeIn"
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800">
          <Search size={16} className="text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages and actions…"
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-zinc-600"
          />
          <kbd className="hidden sm:inline text-[10px] text-zinc-600 border border-zinc-700 rounded px-1.5 py-0.5 font-mono-ui">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto custom-scrollbar py-2">
          {groups.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-zinc-600">No matches for "{query}".</p>
          )}
          {groups.map((g) => (
            <div key={g.name} className="mb-1 last:mb-0">
              <p className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">
                {g.name}
              </p>
              {g.items.map((cmd) => {
                flatIndex += 1;
                const isActive = flatIndex === safeActiveIndex;
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    onMouseEnter={() => setActiveIndex(flatIndex)}
                    onClick={() => run(cmd)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition ${
                      isActive ? "bg-zinc-800/80 text-white" : "text-zinc-300 hover:bg-zinc-900"
                    }`}
                  >
                    {Icon && <Icon size={14} className="text-zinc-500 shrink-0" />}
                    <span className="flex-1 truncate">{cmd.label}</span>
                    {cmd.hint && <span className="text-xs text-zinc-600">{cmd.hint}</span>}
                    {isActive && <CornerDownLeft size={12} className="text-zinc-500" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800 text-[10px] text-zinc-600">
          <span className="flex items-center gap-1">
            <ArrowRight size={10} className="rotate-90" /> navigate
          </span>
          <span>Code Club Command Center</span>
        </div>
      </div>
    </div>
  );
}
