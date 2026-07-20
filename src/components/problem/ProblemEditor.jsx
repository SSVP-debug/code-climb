import { useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Maximize2, Minimize2, RotateCcw, Copy, Check, Minus, Plus } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import {
  saveCode,
  loadFontSize,
  saveFontSize,
  EDITOR_FONT_SIZE_MIN,
  EDITOR_FONT_SIZE_MAX,
} from "../../utils/editorStorage";

function ProblemEditor({
  slug,
  language,
  setLanguage,
  code,
  setCode,
  customInput,
  setCustomInput,
  onRun,
  onSubmit,
  onReset,
  running,
  submitting,
}) {
  const [showAdvancedTesting, setShowAdvancedTesting] = useState(false);
  const [fontSize, setFontSize] = useState(loadFontSize);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const { theme } = useTheme();
  const editorRef = useRef(null);

  function adjustFontSize(delta) {
    setFontSize((prev) => {
      const next = Math.min(
        EDITOR_FONT_SIZE_MAX,
        Math.max(EDITOR_FONT_SIZE_MIN, prev + delta)
      );
      saveFontSize(next);
      return next;
    });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1500);
    } catch {
      // Clipboard API can fail on insecure origins / permissions — fail
      // quietly rather than surfacing a scary error for a nice-to-have.
    }
  }

  /**
   * Called once when Monaco mounts.
   * Registers keyboard shortcuts:
   *   Ctrl+Enter (Mac: Cmd+Enter)        → Run code
   *   Ctrl+Shift+Enter (Mac: Cmd+Shift+Enter) → Submit code
   *
   * These are the de-facto standard shortcuts for any coding platform.
   * Their absence signals an unfinished product to experienced developers.
   */
  function handleEditorMount(editor, monaco) {
    editorRef.current = editor;

    // ── Ctrl+Enter → Run ────────────────────────────────────────────────────
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => {
        if (!running && !submitting) onRun();
      }
    );
    editor.addCommand(
      monaco.KeyMod.CtrlCmd |
      monaco.KeyCode.KeyS,
      () => {
        // Use editor.getValue() rather than the `code` prop — this callback
        // is registered once on mount, so `code` would otherwise be a stale
        // closure over whatever it was when Monaco first mounted.
        saveCode(slug, language, editor.getValue());
      }
    );
    editor.addCommand(
      monaco.KeyCode.Escape,
      () => {
        setShowAdvancedTesting(false);
        setIsFullscreen(false);
      }
    );

    // ── Ctrl+Shift+Enter → Submit ───────────────────────────────────────────
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
      () => {
        if (!running && !submitting) onSubmit();
      }
    );
  }

  return (
    <div className={
      isFullscreen
        ? "fixed inset-0 z-50 flex flex-col bg-zinc-900 shadow-2xl"
        : "flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl"
    }>
      {/* ── Editor Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            {theme.words.language}
          </span>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-zinc-800 text-zinc-200 text-sm border-none rounded-md px-2 py-1 outline-none hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>

          {/* Font size — a reading preference, not a per-problem setting,
              so it persists globally (utils/editorStorage.js) rather than
              per-slug like code/language. */}
          <div className="hidden sm:flex items-center gap-0.5 ml-1 bg-zinc-800/60 rounded-md px-0.5">
            <button
              type="button"
              onClick={() => adjustFontSize(-1)}
              disabled={fontSize <= EDITOR_FONT_SIZE_MIN}
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
              onClick={() => adjustFontSize(1)}
              disabled={fontSize >= EDITOR_FONT_SIZE_MAX}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-30"
              title="Increase font size"
            >
              <Plus size={13} />
            </button>
          </div>

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors"
              title="Reset to starter code"
            >
              <RotateCcw size={14} />
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors"
            title="Copy code"
          >
            {justCopied ? (
              <Check size={14} className="text-green-400" />
            ) : (
              <Copy size={14} />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-700 transition-colors"
            title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen / Zen mode"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Keyboard shortcut hints — visible to power users, unobtrusive */}
          <span className="text-xs text-zinc-600 hidden sm:block select-none">
            <kbd className="font-mono">{navigator.platform.includes("Mac")
              ? "⌘+↵"
              : "Ctrl+↵"}</kbd> Run &nbsp;·&nbsp;
            <kbd className="font-mono">{navigator.platform.includes("Mac")
              ? "⌘+⇧+↵"
              : "Ctrl+⇧+↵"}</kbd> Submit
          </span>

          <button
            onClick={onRun}
            disabled={running || submitting}
            className="px-5 py-2 rounded-xl text-sm font-semibold border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-all disabled:opacity-50"
            title="Run code (Ctrl+Enter)"
          >
            {running ? theme.words.running : theme.words.run}
          </button>

          <button
            data-testid="submit-code-button"
            onClick={onSubmit}
            disabled={running || submitting}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${submitting
              ? "bg-green-500/20 text-green-500 border border-green-500/30"
              : "bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-900/20"
              }`}
            title="Submit solution (Ctrl+Shift+Enter)"
          >
            {submitting ? theme.words.submitting : theme.words.submit}
          </button>
        </div>
      </div>

      {/* ── Editor Content ───────────────────────────────────────────────── */}
      <div className="flex-grow min-h-[400px]">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(value) => setCode(value || "")}
          theme="vs-dark"
          onMount={handleEditorMount}
          saveViewState={true}
          options={{
            fontSize,
            minimap: { enabled: false },
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: language === "javascript" ? 2 : 4,
            // Accessibility
            accessibilitySupport: "auto",
            wordWrap: "on",
            occurrencesHighlight: "off",
            selectionHighlight: false,
            // Performance
            renderWhitespace: "none",
            smoothScrolling: true,
            guides: {
              bracketPairs: true,
            },
            bracketPairColorization: {
              enabled: true,
            },
            fontFamily:
              "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            renderLineHighlight: "all",
            mouseWheelZoom: true,
            scrollbar: {
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
          }}
        />
      </div>

      {/* ── Advanced Testing Footer ──────────────────────────────────────── */}
      <div className="mb-2 px-4">
        <button
          type="button"
          onClick={() => setShowAdvancedTesting(!showAdvancedTesting)}
          className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-300 transition-colors"
        >
          <span>{showAdvancedTesting ? "▼" : "▶"}</span>
          {theme.words.advancedTesting}
        </button>
      </div>

      {showAdvancedTesting && (
        <div className="mb-4 px-4">
          <label
            htmlFor="custom-input"
            className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2"
          >
            {theme.words.customInput}
          </label>

          <textarea
            id="custom-input"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 font-mono text-sm text-zinc-200 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600"
            placeholder={theme.words.customInputPlaceholder}
          />
        </div>
      )}
    </div>
  );
}

export default ProblemEditor;