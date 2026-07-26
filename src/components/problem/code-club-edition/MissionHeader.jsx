import { ChevronRight } from "lucide-react";
import codeClubEdition from "../../../data/codeClubEdition";
import { CHAPTER_ICONS, DEFAULT_CHAPTER_ICON, CHAPTER_COLOR_CLASSES } from "./codeClubEditionTheme";

/**
 * Resolves a chapter + mission pair from the campaign map. Returns null if
 * either isn't found (e.g. a stale/manipulated ?edition= query param) —
 * MissionHeader renders nothing in that case rather than showing broken
 * story context, and the underlying coding workspace is completely
 * unaffected either way.
 */
function findMissionContext(chapterId, slug) {
  const chapter = codeClubEdition.find((c) => c.id === chapterId);
  if (!chapter) return null;
  const mission = chapter.missions.find((m) => m.slug === slug);
  if (!mission) return null;
  return { chapter, mission };
}

/**
 * The ONLY addition this feature makes to the existing problem page (per
 * the PRD: "Do NOT redesign the existing coding workspace"). Everything
 * else — editor, run/submit, hints, editorial — is untouched. Renders
 * nothing when the problem wasn't opened from a mission link.
 */
function MissionHeader({ chapterId, slug }) {
  if (!chapterId) return null;
  const context = findMissionContext(chapterId, slug);
  if (!context) return null;

  const { chapter, mission } = context;
  const colors = CHAPTER_COLOR_CLASSES[chapter.color] || CHAPTER_COLOR_CLASSES.violet;
  const Icon = CHAPTER_ICONS[chapter.icon] || DEFAULT_CHAPTER_ICON;

  return (
    <div className={`mb-5 rounded-2xl border ${colors.border} ${colors.bg} px-4 py-3.5`}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 flex-wrap">
        <span className={colors.text}>Code Club Edition</span>
        <ChevronRight size={12} className="text-zinc-600" aria-hidden="true" />
        <span>{chapter.title}</span>
        <ChevronRight size={12} className="text-zinc-600" aria-hidden="true" />
        <span className="text-zinc-500">Mission {mission.missionNumber}</span>
      </div>

      <div className="mt-2 flex items-start gap-2.5">
        <span className={`flex-shrink-0 mt-0.5 ${colors.text}`}>
          <Icon size={16} strokeWidth={2} aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-white">{mission.missionTitle}</h3>
          {mission.storyIntro && (
            <p className="text-xs text-zinc-400 italic mt-0.5 leading-relaxed">
              "{mission.storyIntro}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default MissionHeader;