import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Clock, ListTodo } from "lucide-react";
import { useAuth } from "../../../context/authContext";
import { useHideDifficultyLabels } from "../../../hooks/useHideDifficultyLabels";
import { STATUS } from "../../../utils/codeClubEditionProgress";
import {
  CHAPTER_ICONS,
  DEFAULT_CHAPTER_ICON,
  CHAPTER_COLOR_CLASSES,
  DIFFICULTY_BADGE,
  formatEstimatedTime,
} from "./codeClubEditionTheme";
import MissionCard from "./MissionCard";
import ChapterCompletionModal from "./ChapterCompletionModal";

function celebrationSeenKey(uid, chapterId) {
  return `cc_seenChapterCelebration:${uid || "anon"}:${chapterId}`;
}

function hasSeenCelebration(uid, chapterId) {
  try {
    return localStorage.getItem(celebrationSeenKey(uid, chapterId)) === "true";
  } catch {
    return false;
  }
}

function markCelebrationSeen(uid, chapterId) {
  try {
    localStorage.setItem(celebrationSeenKey(uid, chapterId), "true");
  } catch {
    /* best-effort only — display-only flag, never read to compute
       progress or XP. Same tradeoff as LearningPathDetail.jsx. */
  }
}

// Props:
//   chapter        — one enriched chapter from useCodeClubEdition()
//   nextChapter     — the chapter this one unlocks, or null (last chapter)
//   onBack()        — return to the campaign map
function ChapterDetail({ chapter, nextChapter, onBack }) {
  const { user } = useAuth();
  const hideDifficulty = useHideDifficultyLabels();
  const colors = CHAPTER_COLOR_CLASSES[chapter.color] || CHAPTER_COLOR_CLASSES.violet;
  const Icon = CHAPTER_ICONS[chapter.icon] || DEFAULT_CHAPTER_ICON;
  const { solvedCount, total, percent, isComplete } = chapter.progress;

  const statusBySlug = new Map(chapter.missionStatuses.map((s) => [s.slug, s.status]));

  // Trigger-once rule, identical to LearningPathDetail.jsx: only celebrate
  // the incomplete → complete transition, not every visit to an
  // already-complete chapter.
  const wasCompleteRef = useRef(isComplete);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const justCompleted = isComplete && !wasCompleteRef.current;
    wasCompleteRef.current = isComplete;

    if (justCompleted && !hasSeenCelebration(user?.uid, chapter.id)) {
      setShowCelebration(true);
      markCelebrationSeen(user?.uid, chapter.id);
    }
  }, [isComplete, chapter.id, user?.uid]);

  function previousMissionTitle(index) {
    return chapter.missions[index - 1]?.missionTitle;
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition w-fit"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to Code Club Edition
      </button>

      {/* Chapter hero */}
      <div className={`rounded-3xl border ${colors.border} bg-gradient-to-br ${colors.gradient} bg-zinc-950 p-6 sm:p-8`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
              Chapter {chapter.chapterNumber}
            </p>
            <h2 className="mt-1 text-2xl font-black text-white">{chapter.title}</h2>
          </div>
          <span className={`flex-shrink-0 p-3 rounded-2xl ${colors.bg} ${colors.text}`}>
            <Icon size={26} strokeWidth={2} aria-hidden="true" />
          </span>
        </div>

        <p className="mt-3 text-sm text-zinc-400 max-w-xl leading-relaxed">{chapter.storyDescription}</p>

        <div className="mt-4 flex items-center gap-3 flex-wrap text-xs text-zinc-500">
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
            <ListTodo size={13} aria-hidden="true" /> {total} missions
          </span>
          <span className="flex items-center gap-1">
            <Clock size={13} aria-hidden="true" /> {formatEstimatedTime(chapter.estimatedTime)}
          </span>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span>{solvedCount}/{total} solved</span>
            <span>{percent}% complete</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${colors.bar} transition-all`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mission list */}
      {total === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-10">
          This chapter's missions aren't unlocked yet — check back soon.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {chapter.missions.map((mission, index) => (
            <MissionCard
              key={mission.slug}
              mission={mission}
              order={index + 1}
              status={statusBySlug.get(mission.slug) ?? STATUS.LOCKED}
              unlockHintTitle={previousMissionTitle(index)}
              chapterId={chapter.id}
            />
          ))}
        </div>
      )}

      {showCelebration && (
        <ChapterCompletionModal
          chapter={chapter}
          nextChapter={nextChapter}
          onDismiss={() => setShowCelebration(false)}
        />
      )}
    </div>
  );
}

export default ChapterDetail;