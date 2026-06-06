import { useState, useEffect } from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  if (actual === null || actual === undefined) return "—";
  const s = String(actual).trim();
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
          ${
            highlight === "pass"
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
    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
      <span className="text-zinc-700">{label}</span>
      <span className="text-zinc-400">{value}</span>
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 animate-pulse">
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

function CompileErrorPanel({ error }) {
  return (
    <div className="bg-zinc-900 border border-yellow-500/30 rounded-2xl p-5 space-y-3">
      <span className="text-yellow-400 text-sm font-semibold font-mono">
        ⚠ Compilation Error
      </span>
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 font-mono text-xs text-yellow-200 whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
        {error || "Unknown compilation error."}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TestcaseResultPanel({
  results,
  compileFailed,
  compileError,
  isRunning,
}) {
  const [activeTab, setActiveTab] = useState(0);

  // Auto-jump to first failing tab when results arrive
  useEffect(() => {
    if (!results || results.length === 0) return;
    const firstFail = results.findIndex((r) => !r.passed || r.error);
    setActiveTab(firstFail === -1 ? 0 : firstFail);
  }, [results]);

  // ── Loading ───────────────────────────────────────────────────────────
  if (isRunning) return <LoadingSkeleton />;

  // ── Pre-run idle ──────────────────────────────────────────────────────
  if (!results && !compileFailed) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-center min-h-[200px]">
        <p className="text-zinc-600 text-sm font-mono">
          Click Run to test against examples
        </p>
      </div>
    );
  }

  // ── Compile error ─────────────────────────────────────────────────────
  if (compileFailed) return <CompileErrorPanel error={compileError} />;

  // ── Empty results guard ───────────────────────────────────────────────
  if (!results || results.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-center min-h-[200px]">
        <p className="text-zinc-600 text-sm font-mono">No results returned.</p>
      </div>
    );
  }

  const safeTab  = Math.min(activeTab, results.length - 1);
  const active   = results[safeTab];
  const passCount = results.filter((r) => r.passed && !r.error).length;
  const allPassed = passCount === results.length;
  const hasRuntimeError = results.some((r) => r.error);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">

      {/* ── Summary header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <span
          className={`text-sm font-semibold font-mono ${
            allPassed ? "text-green-400" : "text-red-400"
          }`}
        >
          {allPassed
            ? `✓ ${results.length}/${results.length} examples passed`
            : `✗ ${passCount}/${results.length} examples passed`}
        </span>
        <div className="flex items-center gap-3">
          <MetaChip
            label="time"
            value={active.time ? `${active.time}s` : null}
          />
          <MetaChip
            label="mem"
            value={active.memory ? `${Math.round(active.memory / 1024)}MB` : null}
          />
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {results.map((r, i) => {
          const isActive  = safeTab === i;
          const isPassing = r.passed && !r.error;

          return (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
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
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  isPassing ? "bg-green-400" : "bg-red-400"
                }`}
              />
              Example {i + 1}
            </button>
          );
        })}
      </div>

      {/* ── Active testcase body ──────────────────────────────────────── */}
      <div className="space-y-3 pt-1">
        {active.error ? (
          // Runtime error: show input + error, no expected/actual diff
          <>
            <DataRow label="Input" value={formatInput(active.input)} />
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">
                Runtime Error
              </span>
              <div className="bg-zinc-950 border border-red-500/25 rounded-lg px-3 py-2.5 font-mono text-xs text-red-300 whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                {active.error}
              </div>
            </div>
          </>
        ) : (
          // Normal: input / expected / actual
          <>
            <DataRow label="Input"           value={formatInput(active.input)} />
            <DataRow label="Expected Output" value={formatExpected(active.expected)} highlight={active.passed ? "pass" : undefined} />
            <DataRow label="Your Output"     value={formatActual(active.actual)}    highlight={active.passed ? "pass" : "fail"} />
          </>
        )}
      </div>

    </div>
  );
}
