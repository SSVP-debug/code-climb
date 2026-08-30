import {
  BookOpen,
  Shapes,
  ListChecks,
  Bookmark,
  Map,
  Sparkles,
} from "lucide-react";
import { useTheme } from "../../../hooks/useTheme";
import HoverTooltip from "../../ui/HoverTooltip";

const navigationItems = [
  {
    id: "code-club-edition",
    label: "Code Club Edition",
    description: "An original story campaign",
    icon: Sparkles,
  },
  {
    id: "learning-paths",
    label: "Learning Paths",
    description: "Your guided roadmap",
    icon: Map,
  },
  {
    id: "browse",
    label: "Browse",
    description: "Explore all problems",
    icon: BookOpen,
  },
  {
    id: "patterns",
    label: "Learn by Pattern",
    description: "Master one concept",
    icon: Shapes,
  },
  {
    id: "playlists",
    label: "Playlists",
    description: "Curated collections",
    icon: ListChecks,
  },
  {
    id: "saved",
    label: "Saved",
    description: "Your bookmarked problems",
    icon: Bookmark,
  },
];

// Future items — uncomment when ready:
// { id: "company",  label: "Company Tracks", description: "Interview prep by company", icon: Building2 }

// orientation="vertical" (default): full card list, used in the desktop
// left sidebar — supports `collapsed` (icon-only, w-12 rail, hover
// tooltip showing the label, same interaction as Claude's own sidebar).
// orientation="horizontal": compact scrollable pill row, used as the
// mobile/tablet replacement for that sidebar (icon + label only — no
// room for the description line at pill size, and a touch target of
// ~40px tall keeps it comfortably tappable). `collapsed` has no effect
// here — the pill row is already compact.
function ProblemsNavigation({ activeView, setActiveView, orientation = "vertical", collapsed = false }) {
  const { theme } = useTheme();

  if (orientation === "horizontal") {
    return (
      <nav className="flex items-center gap-2 px-3 py-2.5 overflow-x-auto no-scrollbar">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-all whitespace-nowrap ${
                active ? "" : "bg-[var(--surface)] text-[var(--muted-foreground)] hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]"
              }`}
              style={
                active
                  ? {
                      backgroundColor: theme.colors.primary,
                      color: "#09090b",
                      boxShadow: `0 10px 15px -3px ${theme.colors.primary}33`,
                    }
                  : undefined
              }
            >
              <Icon size={14} />
              {item.label}
            </button>
          );
        })}
      </nav>
    );
  }

  if (collapsed) {
    return (
      <nav className="flex flex-col items-center gap-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;

          return (
            <HoverTooltip key={item.id} label={item.label}>
              <button
                onClick={() => setActiveView(item.id)}
                aria-label={item.label}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                  active ? "" : "text-[var(--muted-foreground)] hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]"
                }`}
                style={
                  active
                    ? {
                        backgroundColor: theme.colors.primary,
                        color: "#09090b",
                        boxShadow: `0 10px 15px -3px ${theme.colors.primary}33`,
                      }
                    : undefined
                }
              >
                <Icon size={16} strokeWidth={2} />
              </button>
            </HoverTooltip>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-0.5">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const active = activeView === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-full text-left rounded-xl px-3 py-2.5 transition-all group ${
              active ? "" : "text-[var(--muted-foreground)] hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]"
            }`}
            style={
              active
                ? {
                    backgroundColor: theme.colors.primary,
                    color: "#09090b",
                    boxShadow: `0 10px 15px -3px ${theme.colors.primary}33`,
                  }
                : undefined
            }
          >
            <div className="flex items-center gap-3">
              <div className={`flex-shrink-0 p-1 rounded-lg ${
                active ? "bg-black/15" : "bg-[var(--surface-elevated)] group-hover:bg-[var(--border-strong)]"
              }`}>
                <Icon size={14} />
              </div>
              <div className="min-w-0">
                <p className={`font-semibold text-sm leading-tight ${
                  active ? "text-black" : "text-[var(--foreground)]"
                }`}>
                  {item.label}
                </p>
                <p className={`text-xs leading-tight mt-0.5 ${
                  active ? "text-black/60" : "text-[var(--muted-foreground)]"
                }`}>
                  {item.description}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </nav>
  );
}

export default ProblemsNavigation;