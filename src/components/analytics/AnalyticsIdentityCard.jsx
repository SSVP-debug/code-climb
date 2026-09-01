import { Award } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import SectionCard from "../ui/layout/SectionCard";

function AnalyticsIdentityCard({ rank, level, xpCurrent, xpNeeded, xpPercent }) {
  const { theme } = useTheme();

  return (
    <SectionCard accented>
      <div className="flex items-center gap-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${theme.colors.primary}1f`, color: theme.colors.primary }}
        >
          <Award size={30} strokeWidth={1.75} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">{rank}</h2>
            <span className="text-[var(--muted-foreground)] text-sm">· {theme.words.level} {level}</span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-xs text-[var(--muted-foreground)]">Progress to next level</span>
              <span className="text-xs text-[var(--muted-foreground)]">
                {xpCurrent.toLocaleString()} / {xpNeeded.toLocaleString()} XP
              </span>
            </div>
            <div className="h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(xpPercent, 100)}%`,
                  backgroundColor: theme.colors.primary,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

export default AnalyticsIdentityCard;