import SkillRadar from "../SkillRadar";
import DifficultyBadge from "./DifficultyBadge";
import { useLanguages } from "../../../hooks/useLanguages";

function LanguageBreakdown({ languageBreakdown, solvedCount }) {
  const total = solvedCount || 1;
  // Content & Execution Architecture cross-check follow-up (Phase 6):
  // was a hardcoded `LANG_LABELS` object literal — one of three
  // near-identical copies found across the frontend this session (see
  // docs/adding-a-language.md's caveat). Derived from the registry now.
  const { languages } = useLanguages();
  const langLabels = Object.fromEntries(languages.map((l) => [l.id, l.name]));

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-widest mb-4">
        Languages
      </h3>
      <div className="space-y-3">
        {languageBreakdown.map((item) => {
          const pct = Math.round((item.solved / total) * 100);
          return (
            <div key={item.language}>
              <div className="flex justify-between text-xs text-[var(--muted-foreground)] mb-1">
                <span className="font-medium text-[var(--foreground)]">{langLabels[item.language] ?? item.language}</span>
                <span>{item.solved} solved</span>
              </div>
              <div className="h-1.5 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--theme-primary,#2dd4bf)] rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PinnedProblemsList({ pinnedProblems }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-widest mb-4">
        Pinned Problems
      </h3>
      <div className="space-y-2">
        {pinnedProblems.map((p) => (
          <div key={p.slug} className="flex items-center justify-between py-1.5 border-b border-[var(--border)] last:border-0">
            <span className="text-sm text-[var(--muted-foreground)]">{p.title}</span>
            <DifficultyBadge difficulty={p.difficulty} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentSolvesList({ recentSolves }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-widest mb-4">
        Recent Solves
      </h3>
      <div className="space-y-2">
        {recentSolves.map((solve, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b border-[var(--border)] last:border-0">
            <span className="text-sm text-[var(--muted-foreground)]">{solve.title}</span>
            <DifficultyBadge difficulty={solve.difficulty} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TopicCoverageSection({ profile }) {
  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-4">Topic Coverage</h2>

      {profile.languageBreakdown?.length > 0 && (
        <LanguageBreakdown
          languageBreakdown={profile.languageBreakdown}
          solvedCount={profile.solvedCount}
        />
      )}

      {profile.pinnedProblems?.length > 0 && (
        <PinnedProblemsList pinnedProblems={profile.pinnedProblems} />
      )}

      {profile.recentSolves?.length > 0 && (
        <RecentSolvesList recentSolves={profile.recentSolves} />
      )}

      <SkillRadar topicStats={profile.topicStats || {}} />
    </div>
  );
}

export default TopicCoverageSection;