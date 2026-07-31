import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Settings,
  Clock,
  HardDrive,
  PlayCircle,
  FileQuestion,
} from "lucide-react";

const STATUS_MAP = {
  // ── Judge verdicts ────────────────────────────────────────────────────
  "Accepted": {
    label: "Accepted",
    icon: CheckCircle2,
    color: "text-green-400",
    border: "border-green-500/30",
    bg: "bg-green-500/10",
    dot: "bg-green-400",
    kind: "accepted",
  },
  "Wrong Answer": {
    label: "Wrong Answer",
    icon: XCircle,
    color: "text-red-400",
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    dot: "bg-red-400",
    kind: "wrong",
  },
  "Compilation Error": {
    label: "Compilation Error",
    icon: AlertTriangle,
    color: "text-yellow-400",
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/10",
    dot: "bg-yellow-400",
    kind: "compile",
  },
  "Runtime Error": {
    label: "Runtime Error",
    icon: AlertTriangle,
    color: "text-orange-400",
    border: "border-orange-500/30",
    bg: "bg-orange-500/10",
    dot: "bg-orange-400",
    kind: "runtime",
  },
  "Judge Error": {
    label: "Judge Error",
    icon: Settings,
    color: "text-zinc-400",
    border: "border-zinc-500/30",
    bg: "bg-zinc-500/10",
    dot: "bg-zinc-400",
    kind: "infra",
  },
  "Time Limit Exceeded": {
    label: "Time Limit Exceeded",
    icon: Clock,
    color: "text-orange-400",
    border: "border-orange-500/30",
    bg: "bg-orange-500/10",
    dot: "bg-orange-400",
    kind: "tle",
  },
  "Memory Limit Exceeded": {
    label: "Memory Limit Exceeded",
    icon: HardDrive,
    color: "text-orange-400",
    border: "border-orange-500/30",
    bg: "bg-orange-500/10",
    dot: "bg-orange-400",
    kind: "mle",
  },

  // ── Run-code verdicts ─────────────────────────────────────────────────
  "Executed": {
    label: "Executed",
    icon: PlayCircle,
    color: "text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    dot: "bg-blue-400",
    kind: "success",
  },
  "Execution Failed": {
    label: "Execution Failed",
    icon: XCircle,
    color: "text-red-400",
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    dot: "bg-red-400",
    kind: "error",
  },
  "Runner Unavailable": {
    label: "Runner Unavailable",
    icon: Settings,
    color: "text-zinc-400",
    border: "border-zinc-500/30",
    bg: "bg-zinc-500/10",
    dot: "bg-zinc-400",
    kind: "infra",
  },
  "Submission Error": {
    label: "Submission Error",
    icon: XCircle,
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
  icon: FileQuestion,
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
 * `icon` is a lucide-react component reference (not a rendered element) —
 * callers render it themselves, e.g. `<meta.icon size={16} strokeWidth={2} />`.
 *
 * Accepts status strings with or without a trailing glyph (legacy callers
 * may still pass "Executed ✓" / "Submission Error ❌") so this stays a
 * drop-in replacement while those call sites get cleaned up.
 *
 * @param {string} status - e.g. "Accepted" | "Wrong Answer" | "Executed"
 * @returns {{ label, icon, color, border, bg, dot, kind }}
 */
export function getStatusMeta(status) {
  if (!status) return UNKNOWN_META;
  const normalized = status.replace(/[\s]*[✓✗❌⚠⚙️]+\s*$/u, "").trim();
  return STATUS_MAP[normalized] ?? STATUS_MAP[status] ?? UNKNOWN_META;
}

/**
 * Returns true if the verdict is a final accepted solve.
 * Used to gate confetti / markProblemSolved calls.
 */
export function isAccepted(status) {
  return status === "Accepted";
}

/**
 * Returns true if the verdict represents a passing run (no errors).
 * Used by SubmissionResultBanner to decide which banner styling to show.
 */
export function isCleanRun(status) {
  return status === "Executed" || status === "Executed ✓";
}