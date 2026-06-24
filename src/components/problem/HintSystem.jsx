import { useState } from "react";

/**
 * HintSystem
 *
 * Progressive hint disclosure: hints are hidden by default.
 * The user reveals one at a time, ordered from vague to specific.
 * Once the section is opened, already-revealed hints stay visible.
 */
function HintSystem({ hints }) {
  const [open, setOpen]           = useState(false);
  const [revealed, setRevealed]   = useState(0);

  if (!hints || hints.length === 0) return null;

  const handleRevealNext = () => {
    setRevealed((r) => Math.min(r + 1, hints.length));
  };

  return (
    <section>
      {/* Section toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full text-left group"
        aria-expanded={open}
      >
        <h3 className="text-lg font-semibold text-white group-hover:text-zinc-300 transition">
          Hints
        </h3>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`text-zinc-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {!open && (
          <span className="ml-auto text-xs text-zinc-600 font-mono">
            {hints.length} hint{hints.length !== 1 ? "s" : ""} available
          </span>
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {/* Already-revealed hints */}
          {hints.slice(0, revealed).map((hint, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3"
            >
              <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-400">
                {hint.level ?? i + 1}
              </span>
              <p className="text-sm text-zinc-300 leading-relaxed">{hint.text}</p>
            </div>
          ))}

          {/* Reveal-next button */}
          {revealed < hints.length ? (
            <button
              onClick={handleRevealNext}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 hover:border-amber-500/40 hover:bg-amber-500/5 transition px-4 py-3 text-sm text-zinc-500 hover:text-amber-400"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 1.5C4 1.5 1.5 4 1.5 7S4 12.5 7 12.5 12.5 10 12.5 7 10 1.5 7 1.5Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <path
                  d="M7 4.5v3M7 9.5v.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
              Reveal hint {revealed + 1} of {hints.length}
            </button>
          ) : (
            <p className="text-center text-xs text-zinc-600 font-mono py-2">
              All hints revealed
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export default HintSystem;
