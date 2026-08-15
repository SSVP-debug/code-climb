import { PartyPopper } from "lucide-react";
import { getStatusMeta } from "../../utils/statusMessages";

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Formats a raw Judge0 output string for display.
 * Strips surrounding quotes from JSON strings, trims whitespace.
 */
function formatOutput(raw) {
  if (raw === null || raw === undefined) return "—";
  const s = String(raw).trim();
  // If it looks like a JSON-quoted string, show the inner value
  if (s.startsWith('"') && s.endsWith('"')) {
    try {
      return JSON.parse(s);
    } catch {
      // not valid JSON — show as-is
    }
  }
  return s || "—";
}

/**
 * Truncates long output strings for display in the diff panel.
 */
function truncate(str, max = 120) {
  const s = String(str ?? "");
  return s.length > max ? s.slice(0, max) + "…" : s;
}

// ── Sub-components ────────────────────────────────────────────────────────

function VerdictBadge({ meta }) {
  return (
    <div
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-xl
        border font-mono text-sm font-semibold tracking-wide
        ${meta.bg} ${meta.border} ${meta.color}
      `}
    >
      <span className="text-base leading-none">
        <meta.icon size={16} strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span>{meta.label}</span>
    </div>
  );
}

function PassRatioBar({ passed, total }) {
  if (!total || total === 0) return null;

  const pct = Math.round((passed / total) * 100);
  const allPassed = passed === total;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400 font-mono">
          {passed} / {total} testcases passed
        </span>
        <span
          className={`font-mono font-semibold ${
            allPassed ? "text-green-400" : "text-red-400"
          }`}
        >
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            allPassed ? "bg-green-500" : "bg-red-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function DiffPanel({ expectedOutput, actualOutput }) {
  if (expectedOutput === undefined && actualOutput === undefined) return null;

  // Both must be non-null to show the diff
  const hasExpected = expectedOutput !== null && expectedOutput !== undefined;
  const hasActual = actualOutput !== null && actualOutput !== undefined;
  if (!hasExpected && !hasActual) return null;

  const expected = truncate(formatOutput(expectedOutput));
  const actual = truncate(formatOutput(actualOutput));

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">
        Output diff
      </p>
      <div className="grid grid-cols-2 gap-3">
        {/* Expected */}
        <div className="space-y-1">
          <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
            Expected
          </span>
          <div className="bg-zinc-950 border border-green-500/20 rounded-lg px-3 py-2 font-mono text-xs text-green-300 break-all min-h-[36px]">
            {expected}
          </div>
        </div>

        {/* Actual */}
        <div className="space-y-1">
          <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
            Your output
          </span>
          <div
            className={`bg-zinc-950 border rounded-lg px-3 py-2 font-mono text-xs break-all min-h-[36px] ${
              expected === actual
                ? "border-green-500/20 text-green-300"
                : "border-red-500/20 text-red-300"
            }`}
          >
            {actual || <span className="text-zinc-600 italic">empty</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

/**
 * SubmitResultCard
 *
 * @param {{ submitResult: object|null, isFirstSolve: boolean }} props
 */
export default function SubmitResultCard({ submitResult, isFirstSolve }) {
  // Nothing to show before the first submission
  if (!submitResult) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-center min-h-[160px]">
        <p className="text-zinc-600 text-sm font-mono">
          Submit your code to see results
        </p>
      </div>
    );
  }

  const meta = getStatusMeta(submitResult.status);
  const isWrongAnswer = meta.kind === "wrong";
  const isAccepted = meta.kind === "accepted";

  return (
    <div
      className={`
        bg-zinc-900 border rounded-2xl p-5 space-y-4
        transition-all duration-300
        ${meta.border}
      `}
    >
      {/* ── Header row ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <VerdictBadge meta={meta} />

          {/* First-solve celebration line */}
          {isAccepted && isFirstSolve && (
            <p className="text-xs text-green-500 font-mono pl-1 pt-0.5 flex items-center gap-1.5">
              <PartyPopper size={13} strokeWidth={2.25} aria-hidden="true" />
              First solve — problem marked complete
            </p>
          )}

          {/* Already solved line */}
          {isAccepted && !isFirstSolve && (
            <p className="text-xs text-zinc-500 font-mono pl-1 pt-0.5">
              Already solved — submission recorded
            </p>
          )}
        </div>

        {/* Execution time — top right */}
        {submitResult.executionTime !== undefined &&
          submitResult.executionTime !== null && (
            <span className="text-[11px] text-zinc-600 font-mono pt-1 shrink-0">
              {submitResult.executionTime}ms
            </span>
          )}
      </div>

      {/* ── Pass ratio bar ── */}
      {submitResult.total > 0 && (
        <PassRatioBar
          passed={submitResult.passed ?? 0}
          total={submitResult.total}
        />
      )}

      {/* ── Output diff — only on wrong answer ── */}
      {isWrongAnswer && (
        <DiffPanel
          expectedOutput={submitResult.expectedOutput}
          actualOutput={submitResult.actualOutput}
        />
      )}

      {/* ── Error detail — compile / runtime / judge errors ── */}
      {(meta.kind === "compile" ||
        meta.kind === "runtime" ||
        meta.kind === "infra" ||
        meta.kind === "error") &&
        submitResult.error && (
          <div className="space-y-1">
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">
              Error detail
            </p>
            <div className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 font-mono text-xs text-red-300 break-all whitespace-pre-wrap max-h-[120px] overflow-y-auto">
              {submitResult.error}
            </div>
          </div>
        )}
    </div>
  );
}