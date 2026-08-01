import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { getStorageData, setStorageData } from "../../../services/storageService";

/**
 * CollapsibleGroup
 *
 * A label + chevron row that folds/unfolds its children. Deliberately has
 * no border/background of its own — it's meant to wrap children that
 * already render their own SectionCard(s), so a second box here would
 * nest a card inside a card. For a single child that doesn't already have
 * a header (a plain block), use SectionCard's own `collapsible` prop
 * instead — this component is specifically for grouping multiple already-
 * boxed things under one shared toggle.
 *
 * State persists across visits via storageService (localStorage) when
 * `storageKey` is provided, same convention as SectionCard's collapsible mode.
 */
function CollapsibleGroup({
  title,
  icon,
  defaultOpen = true,
  storageKey = null,
  children,
}) {
  const [open, setOpen] = useState(() =>
    storageKey ? getStorageData(storageKey, defaultOpen) : defaultOpen
  );

  function toggle() {
    const next = !open;
    setOpen(next);
    if (storageKey) setStorageData(storageKey, next);
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 mb-3 px-1 py-1.5 -mx-1 rounded-lg hover:bg-white/[0.03] transition text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-zinc-400 uppercase tracking-wide">
          {icon && (
            <span className="flex-shrink-0" aria-hidden="true">
              {icon}
            </span>
          )}
          {title}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={`text-zinc-500 transition-transform duration-200 flex-shrink-0 ${open ? "" : "-rotate-90"}`}
          aria-hidden="true"
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

export default CollapsibleGroup;