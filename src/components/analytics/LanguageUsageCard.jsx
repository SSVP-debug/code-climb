import { Code2 } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import SectionCard from "../ui/layout/SectionCard";
import EmptyState from "../ui/feedback/EmptyState";

function LanguageUsageCard({ languageStats, favoriteLanguage }) {
  const { theme } = useTheme();

  const entries = Object.entries(languageStats).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const max = entries.length > 0 ? entries[0][1] : 0;

  return (
    <SectionCard
      title="Language Usage"
      subtitle={total > 0 ? `${theme.words.favoriteLanguage}: ${favoriteLanguage}` : undefined}
      icon={<Code2 size={18} strokeWidth={2} />}
      accented
    >
      {entries.length === 0 ? (
        <EmptyState
          icon={<Code2 size={28} strokeWidth={1.75} />}
          title="No submissions yet"
          description="Your language mix will appear here once you start submitting."
          compact
        />
      ) : (
        <div className="space-y-3.5">
          {entries.map(([lang, count]) => {
            const widthPercent = max > 0 ? Math.max((count / max) * 100, 4) : 0;
            const isFavorite = lang === favoriteLanguage;
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={lang}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className={`text-sm capitalize ${isFavorite ? "text-white font-medium" : "text-zinc-300"}`}>
                    {lang}
                  </span>
                  <span className="text-xs text-zinc-500 flex-shrink-0 ml-2">
                    {count} · {percent}%
                  </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${widthPercent}%`,
                      backgroundColor: isFavorite ? theme.colors.primary : `${theme.colors.primary}66`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

export default LanguageUsageCard;