import {
  Search,
  Radar,
  Rocket,
  Crown,
  ShieldEllipsis,
  Lock,
  CheckCircle2,
  PlayCircle,
  Sparkles,
} from "lucide-react";

// Chapter-level icon, keyed by the `icon` field in src/data/codeClubEdition.js.
// Literal import map (not a dynamic lucide-react[iconName] lookup) — same
// reasoning as learningPathIcons.js: every icon actually used needs a
// literal import site for Tailwind/bundler tooling to see it.
export const CHAPTER_ICONS = {
  Search,
  Radar,
  Rocket,
  Crown,
  ShieldEllipsis,
};

// Falls back to this when a chapter's icon key isn't found (shouldn't
// happen for real content, but a coming-soon chapter authored quickly
// without picking an icon yet shouldn't crash the page).
export const DEFAULT_CHAPTER_ICON = Sparkles;

export const MISSION_STATUS_ICONS = {
  solved: CheckCircle2,
  current: PlayCircle,
  locked: Lock,
};

// Tailwind's JIT scanner needs literal class strings in source (can't be
// built as `bg-${color}-500`) — see LEARNING_PATH_COLOR_CLASSES in
// learningPathIcons.js for the same constraint.
//
// Deliberately a different five-color palette than Learning Paths
// (teal/amber/rose) so Code Club Edition reads as its own premium space,
// not a reskin — and deliberately never green, which was an unintentional
// early default elsewhere in this codebase, not a real brand choice.
// Brand teal is reserved for chrome (buttons, progress bars, the overall
// hero) rather than every chapter, so five story worlds don't all collapse
// into the same accent.
export const CHAPTER_COLOR_CLASSES = {
  violet: {
    border: "border-violet-500/30",
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    bar: "bg-violet-500",
    glow: "shadow-violet-900/40",
    gradient: "from-violet-500/25 via-violet-900/10 to-transparent",
  },
  cyan: {
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    bar: "bg-cyan-500",
    glow: "shadow-cyan-900/40",
    gradient: "from-cyan-500/25 via-cyan-900/10 to-transparent",
  },
  sky: {
    border: "border-sky-500/30",
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    bar: "bg-sky-500",
    glow: "shadow-sky-900/40",
    gradient: "from-sky-500/25 via-sky-900/10 to-transparent",
  },
  amber: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    bar: "bg-amber-500",
    glow: "shadow-amber-900/40",
    gradient: "from-amber-500/25 via-amber-900/10 to-transparent",
  },
  rose: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    bar: "bg-rose-500",
    glow: "shadow-rose-900/40",
    gradient: "from-rose-500/25 via-rose-900/10 to-transparent",
  },
};

export const DIFFICULTY_BADGE = {
  Beginner: "bg-teal-500/10 text-teal-400 border-teal-500/30",
  Intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  Advanced: "bg-rose-500/10 text-rose-400 border-rose-500/30",
};

export function formatEstimatedTime({ low, high, unit }) {
  return `${low}–${high} ${unit}`;
}