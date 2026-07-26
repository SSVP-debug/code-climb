import { Check, Clock, ListTodo, Lock } from "lucide-react";
import { useHideDifficultyLabels } from "../../../hooks/useHideDifficultyLabels";
import {
  CHAPTER_ICONS,
  DEFAULT_CHAPTER_ICON,
  CHAPTER_COLOR_CLASSES,
  DIFFICULTY_BADGE,
  formatEstimatedTime,
} from "./codeClubEditionTheme";

function ChapterCard({ chapter, onOpen }) {
  const hideDifficulty = useHideDifficultyLabels();
  const colors = CHAPTER_COLOR_CLASSES[chapter.color] || CHAPTER_COLOR_CLASSES.violet;
  const Icon = CHAPTER_ICONS[chapter.icon] || DEFAULT_CHAPTER_ICON;
  const { solvedCount, total, percent, isComplete, isStarted } = chapter.progress;

  const locked = !chapter.unlocked;
  const comingSoon = chapter.comingSoon;

  return (
    <button
      onClick={() => !locked && !comingSoon && onOpen(chapter.id)}
      disabled={locked || comingSoon}
      className={`text-left rounded-3xl border overflow-hidden transition-all group relative flex flex-col ${
        locked || comingSoon
          ? "border-zinc-800 bg-zinc-950 cursor-not-allowed"
          : `${colors.border} bg-zinc-950 hover:-translate-y-0.5 hover:shadow-2xl ${colors.glow}`
      }`}
    >
      {/* Banner — large artwork placeholder: layered radial glow + icon,
          no image asset dependency, matches the project's icon-not-emoji
          convention while still reading as a "cover". */}
      <div
        className={`relative h-28 flex items-center justify-between px-5 ${
          locked || comingSoon
            ? "bg-zinc-900"
            : `bg-gradient-to-br ${colors.gradient}`
        }`}
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Chapter {chapter.chapterNumber}
          </p>
          <h3 className={`mt-1 text-lg font-black leading-tight ${locked || comingSoon ? "text-zinc-500" : "text-white"}`}>
            {chapter.title}
          </h3>
        </div>
        <span
          className={`flex-shrink-0 p-2.5 rounded-2xl ${
            locked || comingSoon ? "bg-zinc-800 text-zinc-600" : `${colors.bg} ${colors.text}`
          }`}
        >
          {locked ? (
            <Lock size={20} strokeWidth={2} aria-hidden="true" />
          ) : (
            <Icon size={20} strokeWidth={2} aria-hidden="true" />
          )}
        </span>

        {isComplete && !locked && (
          <span className="absolute top-3 right-3 text-[10px] font-bold text-verdict-accept flex items-center gap-1 bg-black/50 rounded-full px-2 py-1">
            <Check size={11} strokeWidth={3} aria-hidden="true" /> Complete
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 flex-1">
          {chapter.tagline}
        </p>

        <div className="mt-3 flex items-center gap-3 flex-wrap text-[11px] text-zinc-500">
          {!hideDifficulty && (
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide rounded-full border px-2 py-0.5 ${
                DIFFICULTY_BADGE[chapter.difficulty] || DIFFICULTY_BADGE.Beginner
              }`}
            >
              {chapter.difficulty}
            </span>
          )}
          <span className="flex items-center gap-1">
            <ListTodo size={12} aria-hidden="true" />
            {comingSoon ? `${chapter.plannedMissionCount} missions` : `${total} missions`}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} aria-hidden="true" /> {formatEstimatedTime(chapter.estimatedTime)}
          </span>
        </div>

        {comingSoon ? (
          <div className="mt-4 inline-flex items-center justify-center w-full rounded-xl py-2 text-xs font-bold uppercase tracking-widest text-zinc-600 border border-zinc-800 bg-zinc-900">
            Coming Soon
          </div>
        ) : locked ? (
          <div className="mt-4 inline-flex items-center justify-center gap-1.5 w-full rounded-xl py-2 text-xs font-semibold text-zinc-500 border border-zinc-800 bg-zinc-900">
            <Lock size={12} aria-hidden="true" /> Complete the previous chapter
          </div>
        ) : (
          <>
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1.5">
                <span>{solvedCount}/{total} solved</span>
                <span>{percent}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${colors.bar} transition-all`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
            <div className="mt-4">
              <span
                className={`inline-flex items-center justify-center w-full rounded-xl py-2 text-sm font-semibold transition ${colors.bg} ${colors.text} border ${colors.border} group-hover:brightness-125`}
              >
                {isStarted ? "Continue Chapter" : "Start Chapter"}
              </span>
            </div>
          </>
        )}
      </div>
    </button>
  );
}

export default ChapterCard;