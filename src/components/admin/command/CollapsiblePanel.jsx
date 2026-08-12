import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * CollapsiblePanel — Overview Phase 3's "reflow the queues so the page
 * reads status → attention → activity → deep-dive" ask. Purely a layout
 * wrapper: it doesn't touch what's inside (the real verification queue
 * data/logic is untouched), just how much of it is visible by default.
 * Defaults open when `defaultOpenCount` items exist and closed otherwise,
 * so an admin with real pending work still sees it immediately rather
 * than behind an extra click.
 */
export default function CollapsiblePanel({ title, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-zinc-200">
          {title}
          {typeof count === "number" && (
            <span className="ml-2 text-xs font-normal text-zinc-500">({count})</span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={`text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-4 pb-4 border-t border-zinc-800 pt-4">{children}</div>}
    </section>
  );
}
