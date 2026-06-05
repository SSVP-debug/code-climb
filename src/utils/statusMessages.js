const STATUS_MAP = {
  // ── Judge verdicts ────────────────────────────────────────────────────
  "Accepted 🎉": {
    label: "Accepted",
    icon: "✓",
    color: "text-green-400",
    border: "border-green-500/30",
    bg: "bg-green-500/10",
    dot: "bg-green-400",
    kind: "accepted",
  },
  "Wrong Answer ❌": {
    label: "Wrong Answer",
    icon: "✗",
    color: "text-red-400",
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    dot: "bg-red-400",
    kind: "wrong",
  },
  "Compilation Error ❌": {
    label: "Compilation Error",
    icon: "⚠",
    color: "text-yellow-400",
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/10",
    dot: "bg-yellow-400",
    kind: "compile",
  },
  "Runtime Error ❌": {
    label: "Runtime Error",
    icon: "⚠",
    color: "text-orange-400",
    border: "border-orange-500/30",
    bg: "bg-orange-500/10",
    dot: "bg-orange-400",
    kind: "runtime",
  },
  "Judge Error ❌": {
    label: "Judge Error",
    icon: "⚙",
    color: "text-zinc-400",
    border: "border-zinc-500/30",
    bg: "bg-zinc-500/10",
    dot: "bg-zinc-400",
    kind: "infra",
  },
  "Time Limit Exceeded ❌": {
    label: "Time Limit Exceeded",
    icon: "⏱",
    color: "text-orange-400",
    border: "border-orange-500/30",
    bg: "bg-orange-500/10",
    dot: "bg-orange-400",
    kind: "tle",
  },
  "Memory Limit Exceeded ❌": {
    label: "Memory Limit Exceeded",
    icon: "📦",
    color: "text-orange-400",
    border: "border-orange-500/30",
    bg: "bg-orange-500/10",
    dot: "bg-orange-400",
    kind: "mle",
  },

  // ── Run-code verdicts ─────────────────────────────────────────────────
  "Executed ✓": {
    label: "Executed",
    icon: "▶",
    color: "text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    dot: "bg-blue-400",
    kind: "success",
  },
  "Execution Failed ❌": {
    label: "Execution Failed",
    icon: "✗",
    color: "text-red-400",
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    dot: "bg-red-400",
    kind: "error",
  },
  "Runner Unavailable ❌": {
    label: "Runner Unavailable",
    icon: "⚙",
    color: "text-zinc-400",
    border: "border-zinc-500/30",
    bg: "bg-zinc-500/10",
    dot: "bg-zinc-400",
    kind: "infra",
  },
  "Submission Error ❌": {
    label: "Submission Error",
    icon: "✗",
    color: "text-red-400",
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    dot: "bg-red-400",
    kind: "error",
  },
};

/** Fallback for any unknown status string. */
const UNKNOWN_META = {
  label: "Unknown",
  icon: "?",
  color: "text-zinc-500",
  border: "border-zinc-700",
  bg: "bg-zinc-800/50",
  dot: "bg-zinc-500",
  kind: "unknown",
};

/**
 * Returns display metadata for a verdict string.
 * Always returns a valid object — never throws or returns undefined.
 *
 * @param {string} status - e.g. "Accepted 🎉" | "Wrong Answer ❌" | "Executed ✓"
 * @returns {{ label, icon, color, border, bg, dot, kind }}
 */
export function getStatusMeta(status) {
  if (!status) return UNKNOWN_META;
  return STATUS_MAP[status] ?? UNKNOWN_META;
}

/**
 * Returns true if the verdict is a final accepted solve.
 * Used to gate confetti / markProblemSolved calls.
 */
export function isAccepted(status) {
  return status === "Accepted 🎉";
}

/**
 * Returns true if the verdict represents a passing run (no errors).
 * Used by ProblemResults to decide which panel to show.
 */
export function isCleanRun(status) {
  return status === "Executed ✓";
}
