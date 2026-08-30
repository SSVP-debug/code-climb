import { Link } from "react-router-dom";
import { useAppContext } from "../../../hooks/useAppContext";
import SectionCard from "../../ui/layout/SectionCard";
import { getLevel } from "../../../utils/xpLevel";
import { Share2 } from "lucide-react";

// Replaces the old PublicProfileCard, which re-rendered a second, simplified
// copy of stats and a 35-day activity grid already shown in Row 2
// (AdvancedStatsSection) and on /profile — see
// plans/004-dashboard-row6-deduplication.md. This is a compact nudge
// pointing at the real pages instead of a second stats block.
//
// Deliberately reuses xpLevel.js (the same module Profile.jsx and
// PublicProfile.jsx use), not levelUtils.js (the module
// RankProgressSection.jsx uses) — those two modules currently implement
// different XP curves (exponential vs. linear 100XP/level), which is a
// separate, unplanned finding flagged in plans/README.md, not something
// this component should paper over by picking one arbitrarily. Since a
// student's public/private profile pages already use xpLevel.js, this CTA
// (which links to those same pages) uses the same module so the level
// number it shows agrees with the page it's about to send them to.
function ProfileShareCard() {
  const { totalXP, username } = useAppContext();

  const level = getLevel(totalXP);

  if (!username) {
    return null;
  }

  return (
    <SectionCard>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            Your public profile is ready to share
          </p>
          <p className="text-[var(--muted-foreground)] text-sm mt-1">
            Level {level} · shareable with recruiters and on LinkedIn
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            to="/profile"
            className="px-4 py-2 text-sm rounded-xl bg-[var(--surface-elevated)] hover:bg-[var(--border-strong)] text-[var(--foreground)] transition-colors"
          >
            View my profile
          </Link>
          <Link
            to={`/u/${username}`}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl bg-[var(--theme-primary,#2dd4bf)] hover:brightness-110 text-[#09090b] font-semibold transition-all"
          >
            <Share2 size={14} strokeWidth={2.5} />
            View public page
          </Link>
        </div>
      </div>
    </SectionCard>
  );
}

export default ProfileShareCard;