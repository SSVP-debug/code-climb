import { useEffect, useRef, useState } from "react";
import {
  MoreHorizontal,
  Minus,
  Plus,
  RotateCcw,
  Copy,
  Check,
  Maximize2,
  Minimize2,
} from "lucide-react";

/**
 * Overflow menu for the code editor toolbar's secondary controls — font
 * size, reset-to-starter, copy code, and fullscreen. Pulled out of
 * ProblemEditor.jsx's primary toolbar to cut down on-screen control count;
 * see plans/005-editor-toolbar-decluttering.md. Purely presentational —
 * all state and handlers are owned by ProblemEditor.jsx and passed in.
 */
function EditorMoreMenu({
  fontSize,
  onFontSizeChange,
  fontSizeMin,
  fontSizeMax,
  onReset,
  onCopy,
  justCopied,
  isFullscreen,
  onToggleFullscreen,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors"
        title="More editor options"
        aria-expanded={open}
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 z-20 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-1.5"
          role="menu"
        >
          <div className="flex items-center justify-between px-2.5 py-1.5">
            <span className="text-xs text-zinc-400">Font size</span>
            <div className="flex items-center gap-0.5 bg-zinc-800/60 rounded-md px-0.5">
              <button
                type="button"
                onClick={() => onFontSizeChange(-1)}
                disabled={fontSize <= fontSizeMin}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-30"
                title="Decrease font size"
              >
                <Minus size={13} />
              </button>
              <span className="text-xs text-zinc-400 w-5 text-center tabular-nums select-none">
                {fontSize}
              </span>
              <button
                type="button"
                onClick={() => onFontSizeChange(1)}
                disabled={fontSize >= fontSizeMax}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-30"
                title="Increase font size"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          {onReset && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onReset();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
            >
              <RotateCcw size={14} />
              Reset to starter code
            </button>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={onCopy}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
          >
            {justCopied ? (
              <Check size={14} className="text-green-400" />
            ) : (
              <Copy size={14} />
            )}
            {justCopied ? "Copied!" : "Copy code"}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onToggleFullscreen();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          </button>
        </div>
      )}
    </div>
  );
}

export default EditorMoreMenu;