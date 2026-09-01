import { Sparkles } from "lucide-react";
import Button from "../../ui/Button";
import { CHAPTER_ICONS, DEFAULT_CHAPTER_ICON } from "./codeClubEditionTheme";

// Campaign-level hero — the "entering a game" moment. Deliberately larger
// and more atmospheric than a normal page header (Steam/Netflix-collection
// inspired), but still built entirely from existing primitives (Button,
// Tailwind, lucide icons) — no new visual dependency.
function ChapterHero({ campaignProgress, currentChapter, onContinue }) {
  const { percent, solvedMissions, totalMissions, isComplete } = campaignProgress;
  const CurrentIcon = currentChapter ? CHAPTER_ICONS[currentChapter.icon] || DEFAULT_CHAPTER_ICON : Sparkles;

  return (
    <div className="relative rounded-3xl overflow-hidden border border-[var(--border)] bg-gradient-to-br from-teal-500/10 via-[var(--surface)] to-[var(--surface)] p-6 sm:p-10">
      {/* Ambient glow — pure CSS, no image asset */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.25em] text-teal-400">
          <Sparkles size={13} aria-hidden="true" /> Code Club Edition
        </span>

        <h1 className="mt-3 text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
          An original story campaign,{" "}
          <span className="text-teal-400">not another problem list.</span>
        </h1>

        <p className="mt-3 text-sm sm:text-base text-[var(--muted-foreground)] max-w-xl">
          Handcrafted mysteries, heists, and network thrillers each one wraps a
          real DSA pattern in a story you'll actually remember solving.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-end gap-6">
          <div className="flex-1 max-w-sm">
            <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] mb-1.5">
              <span>Campaign progress</span>
              <span className="font-semibold text-[var(--foreground)]">{percent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
              <div
                className="h-full rounded-full bg-teal-500 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-[var(--muted-foreground)]">
              {solvedMissions}/{totalMissions} missions solved
            </p>
          </div>

          {currentChapter && (
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0 p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-teal-400">
                <CurrentIcon size={18} strokeWidth={2} aria-hidden="true" />
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
                  {isComplete ? "Campaign complete" : "Current chapter"}
                </p>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {currentChapter.title}
                </p>
              </div>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            onClick={onContinue}
            className="sm:ml-auto"
          >
            {isComplete ? "Revisit the Campaign" : solvedMissions > 0 ? "Continue Adventure" : "Start Adventure"} →
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ChapterHero;