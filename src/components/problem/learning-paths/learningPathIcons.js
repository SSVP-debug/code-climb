import { Sprout, Zap, Flame, Lock, CheckCircle2, PlayCircle } from "lucide-react";

// Path-level icon, keyed by the `icon` field in src/data/learningPaths.js.
// A static map (rather than a dynamic lucide-react[iconName] lookup) so
// every icon actually used has a literal import site — matches the
// convention in src/themes/themeIcons.js, which deliberately replaced an
// emoji-per-item scheme with lucide icons for this exact reason.
export const LEARNING_PATH_ICONS = {
  Sprout,
  Zap,
  Flame,
};

// Per-problem-row status icon — keys match learningPathProgress.js's
// STATUS enum.
export const STATUS_ICONS = {
  solved: CheckCircle2,
  current: PlayCircle,
  locked: Lock,
};

// Tailwind's JIT scanner needs literal class strings in source — see
// PatternCard.jsx's COLOR_CLASSES comment for why this can't be built as
// `bg-${color}-500`.
//
// Beginner=teal (the actual Code Club brand accent), Intermediate=amber,
// Advanced=rose — deliberately not reusing green anywhere in this set;
// green was an unintentional early default elsewhere in this codebase,
// not a real brand choice, and this is new premium-feeling surface.
export const LEARNING_PATH_COLOR_CLASSES = {
  teal: { border: "border-teal-500/30", bg: "bg-teal-500/10", text: "text-teal-400", bar: "bg-teal-500" },
  amber: { border: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-400", bar: "bg-amber-500" },
  rose: { border: "border-rose-500/30", bg: "bg-rose-500/10", text: "text-rose-400", bar: "bg-rose-500" },
};
