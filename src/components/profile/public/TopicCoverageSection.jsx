import SkillRadar from "../SkillRadar";
import DifficultyBadge from "./DifficultyBadge";

const LANG_LABELS = { python: "Python", javascript: "JavaScript", java: "Java", cpp: "C++" };

function LanguageBreakdown({ languageBreakdown, solvedCount }) {
  const total = solvedCount || 1;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">
        Languages
      </h3>
      <div className="space-y-3">
        {languageBreakdown.map((item) => {
          const pct = Math.round((item.solved / total) * 100);
          return (
            <div key={item.language}>
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span className="font-medium text-white">{LANG_LABELS[item.language] ?? item.language}</span>
                <span>{item.solved} solved</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
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
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">
        Pinned Problems
      </h3>
      <div className="space-y-2">
        {pinnedProblems.map((p) => (
          <div key={p.slug} className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0">
            <span className="text-sm text-zinc-300">{p.title}</span>
            <DifficultyBadge difficulty={p.difficulty} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentSolvesList({ recentSolves }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-4">
        Recent Solves
      </h3>
      <div className="space-y-2">
        {recentSolves.map((solve, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0">
            <span className="text-sm text-zinc-300">{solve.title}</span>
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