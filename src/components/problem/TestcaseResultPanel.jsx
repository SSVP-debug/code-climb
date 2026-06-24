import { useState, useEffect, useMemo } from "react";
import { useTheme } from "../../context/ThemeContext";

// ── Runtime error normalisation ───────────────────────────────────────────────
//
// Detects "RUNTIME_ERROR: ..." in stdout (result.actual) and moves it to
// result.error so all downstream logic has a single place to check.
// Returns a new array — never mutates the input.

function normaliseResults(results) {
  if (!results) return results;
  return results.map((r) => {

    // Already has a real stderr error — leave it
    if (r.error) return r;

    const actual = String(r.actual ?? "").trim();
    if (actual.startsWith("RUNTIME_ERROR:")) {
      return {
        ...r,
        actual: "",
        passed: false,
        error: actual.replace(/^RUNTIME_ERROR:\s*/, ""),
      };
    }
    return r;
  });
}

// ── Formatters ────────────────────────────────────────────────────────────────

function formatInput(input) {
  if (!input || typeof input !== "object") return String(input ?? "—");
  return Object.entries(input)
    .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
    .join("\n");
}

function formatExpected(expected) {
  if (expected === null || expected === undefined) return "—";
  return JSON.stringify(expected);
}

function formatActual(actual) {
  const s = String(actual ?? "").trim();
  return s === "" ? "(empty)" : s;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DataRow({ label, value, highlight }) {
  return (
    <div className="space-y-1.5">
      <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">
        {label}
      </span>
      <div
        className={`
          rounded-lg px-3 py-2.5 text-sm font-mono leading-relaxed
          whitespace-pre-wrap break-all border
          ${highlight === "pass"
            ? "bg-green-500/5 border-green-500/20 text-green-300"
            : highlight === "fail"
              ? "bg-red-500/5 border-red-500/20 text-red-300"
              : "bg-zinc-950 border-zinc-800 text-zinc-200"
          }
        `}
      >
        {value}
      </div>
    </div>
  );
}

function MetaChip({ label, value }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono">
      <span className="text-zinc-700">{label}</span>
      <span className="text-zinc-400">{value}</span>
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-7 w-24 rounded-lg bg-zinc-800" />
        ))}
      </div>
      <div className="space-y-3 pt-1">
        <div className="h-4 w-16 rounded bg-zinc-800" />
        <div className="h-10 rounded-lg bg-zinc-800" />
        <div className="h-4 w-20 rounded bg-zinc-800" />
        <div className="h-10 rounded-lg bg-zinc-800" />
        <div className="h-4 w-20 rounded bg-zinc-800" />
        <div className="h-10 rounded-lg bg-zinc-800" />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TestcaseResultPanel({
  results: rawResults,
  compileFailed,
  compileError,
  isRunning,
  examples = [],
}) {
  const [activeTab, setActiveTab] = useState(0);
  const { theme } = useTheme();


  // Normalise once — promotes "RUNTIME_ERROR:" stdout strings to r.error
  const results = useMemo(
    () => normaliseResults(rawResults),
    [rawResults]
  );

  // Auto-jump to first failing tab when results arrive
  useEffect(() => {
    if (!results || results.length === 0) return;
    const firstFail = results.findIndex((r) => !r.passed || r.error);
    setActiveTab(firstFail === -1 ? 0 : firstFail);
  }, [results]);

  if (isRunning) return <LoadingSkeleton />;

  if (!results && !compileFailed) {
    if (examples.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-[160px]">
          <p className="text-zinc-600 text-sm font-mono">
            Click {theme.words.run} to test against examples
          </p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {examples.map((ex, i) => (
          <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">
              Example {i + 1}
            </span>
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-600">Input</span>
              <div className="rounded-lg px-3 py-2 text-sm font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 whitespace-pre-wrap break-all">
                {ex.input}
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-600">Expected</span>
              <div className="rounded-lg px-3 py-2 text-sm font-mono bg-zinc-900 border border-zinc-800 text-zinc-300">
                {ex.output}
              </div>
            </div>
            {ex.explanation && (
              <p className="text-xs text-zinc-500 font-mono pt-0.5">{ex.explanation}</p>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (compileFailed) {
    return (
      <div className="space-y-3">
        <span className="text-yellow-400 text-sm font-semibold font-mono">
          ⚠ {theme.words.compileError}
        </span>
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 font-mono text-xs text-yellow-200 whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
          {compileError || "Unknown compilation error."}
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[160px]">
        <p className="text-zinc-600 text-sm font-mono">No results returned.</p>
      </div>
    );
  }

  const safeTab = Math.min(activeTab, results.length - 1);
  const active = results[safeTab];
  const passCount = results.filter((r) => r.passed && !r.error).length;
  const allPassed = passCount === results.length;

  return (
    <div className="space-y-4">

      {/* ── Summary + meta ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <span
          className={`text-sm font-semibold font-mono ${allPassed ? "text-green-400" : "text-red-400"
            }`}
        >
          {allPassed
            ? `✓ ${results.length}/${results.length} passed`
            : `✗ ${passCount}/${results.length} passed`}
        </span>
        <div className="flex items-center gap-3">
          <MetaChip label="time" value={active.time ? `${active.time}s` : null} />
          <MetaChip
            label="mem"
            value={active.memory ? `${Math.round(active.memory / 1024)}MB` : null}
          />
        </div>
      </div>

      {/* ── Example tabs ─────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap relative"
        style={{ zIndex: 9999 }}>
        {results.map((r, i) => {
          const isActive = safeTab === i;
          const isPassing = r.passed && !r.error;

          return (
            <button
              key={i}
              onClick={() => {
                setActiveTab(i);
              }}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-mono font-medium
                flex items-center gap-1.5 transition-all duration-150
                ${isActive
                  ? isPassing
                    ? "bg-green-500/15 border border-green-500/40 text-green-300"
                    : "bg-red-500/15 border border-red-500/40 text-red-300"
                  : isPassing
                    ? "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-green-500/30 hover:text-green-400"
                    : "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-red-500/30 hover:text-red-400"
                }
              `}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isPassing ? "bg-green-400" : "bg-red-400"
                  }`}
              />
              Example {i + 1}
            </button>
          );
        })}
      </div>


      {/* ── Active testcase body ──────────────────────── */}
      <div className="space-y-4">

        {/* Status Banner */}
        <div
          className={`
      rounded-xl
      px-4 py-3
      font-medium
      ${active.error
              ? "bg-red-500/10 border border-red-500/30 text-red-400"
              : active.passed
                ? "bg-green-500/10 border border-green-500/30 text-green-400"
                : "bg-red-500/10 border border-red-500/30 text-red-400"
            }
    `}
        >
          {active.error
            ? "⚠ Runtime Error"
            : active.passed
              ? "✓ Passed"
              : "✗ Wrong Answer"}
        </div>

        {active.error ? (
          <>
            <DataRow
              label="Input"
              value={formatInput(active.input)}
            />

            <div className="rounded-lg border border-red-500/25 bg-red-500/5 p-4">
              <p className="text-red-400 font-medium">
                {theme.words.runtimeError}
              </p>

              <p className="text-zinc-500 text-sm mt-1">
                Open the {theme.words.debug} tab for details →
              </p>
            </div>
          </>
        ) : (
          <>
            <DataRow
              label="Input"
              value={formatInput(active.input)}
            />

            <DataRow
              label="Expected Output"
              value={formatExpected(active.expected)}
              highlight="pass"
            />

            <DataRow
              label="Your Output"
              value={formatActual(active.actual)}
              highlight={active.passed ? "pass" : "fail"}
            />
          </>
        )}
      </div>

    </div>
  );
}
