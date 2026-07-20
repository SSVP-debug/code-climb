import { Link, useLocation } from "react-router-dom";
import { Trophy, Swords, Lock, Users } from "lucide-react";

/**
 * ClubSubNav — the tab strip shown on every /club/* section page so
 * students can move between Leaderboard / Public Contests / Private
 * Contests / Battle Rooms without going back to the hub each time.
 * Same pattern as ProblemsNavigation for /problems' Browse/Patterns/etc.
 *
 * Battle Rooms is rendered but visually marked "Soon" — the route exists
 * (renders a coming-soon page, Phase 12E) so the tab isn't a dead link.
 */
const SECTIONS = [
  { to: "/club/leaderboard",      label: "Leaderboard",      icon: Trophy },
  { to: "/club/public-contests",  label: "Public Contests",  icon: Swords },
  { to: "/club/private-contests", label: "Private Contests", icon: Lock },
  { to: "/club/battle-rooms",     label: "Battle Rooms",     icon: Users },
];

export default function ClubSubNav() {
  const location = useLocation();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-zinc-800 mb-6 -mx-1 px-1">
      <Link
        to="/club"
        className="flex-shrink-0 px-3 py-2.5 text-sm text-zinc-500 hover:text-zinc-300 transition"
      >
        ← Club
      </Link>

      {SECTIONS.map((section) => {
        const active =
          location.pathname === section.to ||
          location.pathname.startsWith(`${section.to}/`);
        const Icon = section.icon;

        return (
          <Link
            key={section.to}
            to={section.to}
            aria-current={active ? "page" : undefined}
            className={`flex-shrink-0 relative flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium transition whitespace-nowrap ${
              active ? "text-white" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Icon size={14} strokeWidth={2} aria-hidden="true" />
            {section.label}
            {section.soon && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500 uppercase tracking-wide">
                Soon
              </span>
            )}
            {active && (
              <span
                aria-hidden="true"
                className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full bg-[var(--theme-primary,#2dd4bf)]"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}