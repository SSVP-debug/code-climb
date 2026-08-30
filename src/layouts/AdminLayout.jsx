import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ThemeSkin from "../themes/ThemeSkin";
import SystemStatusPill from "../components/admin/command/SystemStatusPill";
import CommandPalette from "../components/admin/command/CommandPalette";
import AttentionCenter from "../components/admin/command/AttentionCenter";
import CommandCenterEntry from "../components/admin/command/CommandCenterEntry";
import { useAdminDashboardMetrics } from "../hooks/useAdminDashboardMetrics";
import {
  LayoutDashboard,
  Users,
  Building2,
  ListChecks,
  BarChart3,
  Activity,
  ScrollText,
  Settings,
  Search,
  Command,
  Radar,
  Puzzle,
} from "lucide-react";

// Plan 001: dedicated admin layout — own sidebar/nav, distinct from the
// student/recruiter/TPO DashboardLayout (which has theming hooks and
// premium-feature gating that have nothing to do with admin work).
// "Isolated" per the confirmed decision means its own layout/nav, not a
// separate auth system — Navbar (and its role-aware admin menu) stays.
//
// Command Center redesign: NAV_GROUPS replaces the old flat NAV_ITEMS list.
// The grouping mirrors the spec's proposed IA (§7) but only for pages that
// actually exist — Recruiters/Contests/Revenue/Ambassadors aren't listed
// because there's no backend/page behind them yet (spec §33: an honest
// empty state beats a fake nav item). Recruiter + TPO + college
// verification already live on the Overview page's queues.
const NAV_GROUPS = [
  {
    label: "Command",
    items: [
      { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
      { to: "/admin/system-health", label: "System Health", icon: Activity },
    ],
  },
  {
    label: "Users",
    items: [
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/colleges", label: "Colleges", icon: Building2 },
    ],
  },
  {
    label: "Platform",
    items: [
      { to: "/admin/problems", label: "Problems", icon: ListChecks },
      { to: "/admin/opportunities", label: "Opportunities", icon: Radar },
      { to: "/admin/contributions", label: "Contributions", icon: Puzzle },
      { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Admin",
    items: [
      { to: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
      { to: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

const PAGE_TITLES = {
  "/admin": "Overview",
  "/admin/users": "Users",
  "/admin/colleges": "Colleges",
  "/admin/problems": "Problems",
  "/admin/opportunities": "Opportunities",
  "/admin/contributions": "Contributions",
  "/admin/opportunities/new": "New Opportunity",
  "/admin/opportunities/import": "Import Opportunities",
  "/admin/analytics": "Analytics",
  "/admin/system-health": "System Health",
  "/admin/audit-logs": "Audit Logs",
  "/admin/settings": "Settings",
};

function NavGroup({ group }) {
  return (
    <div className="mb-5 last:mb-0">
      <p className="px-3 mb-1.5 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] font-semibold lg:block hidden">
        {group.label}
      </p>
      <div className="flex lg:flex-col gap-1">
        {group.items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                isActive
                  ? "bg-[var(--surface-elevated)] text-[var(--foreground)] shadow-[inset_0_0_0_1px_rgba(45,212,191,0.15)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
              }`
            }
          >
            <Icon size={16} strokeWidth={2} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

function AdminLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { metrics } = useAdminDashboardMetrics();

  const pendingApprovals =
    (metrics?.approvals?.pendingRecruiterApprovals || 0) + (metrics?.approvals?.pendingTpoApprovals || 0);

  // Spec §8: CMD/CTRL+K anywhere inside the command center opens the palette.
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const closePalette = useCallback(() => setPaletteOpen(false), []);

  const commands = useMemo(() => {
    const navCommands = ALL_NAV_ITEMS.map((item) => ({
      id: `nav-${item.to}`,
      group: "Go to",
      label: item.label,
      icon: item.icon,
      to: item.to,
      keywords: item.label,
    }));

    const actionCommands = [
      {
        id: "action-recruiter-queue",
        group: "Actions",
        label: "Review pending recruiters",
        icon: Users,
        hint: pendingApprovals > 0 ? `${pendingApprovals} pending` : undefined,
        keywords: "recruiter verification approve",
        action: () => navigate("/admin#recruiter-queue"),
      },
      {
        id: "action-tpo-queue",
        group: "Actions",
        label: "Review pending colleges / TPOs",
        icon: Building2,
        keywords: "tpo college verification approve",
        action: () => navigate("/admin#tpo-queue"),
      },
      {
        id: "action-system-health",
        group: "Actions",
        label: "Open live system status",
        icon: Activity,
        keywords: "health status uptime incident",
        to: "/admin/system-health",
      },
    ];

    return [...navCommands, ...actionCommands];
  }, [navigate, pendingApprovals]);

  const pageTitle = PAGE_TITLES[location.pathname] || "Command Center";

  return (
    <ThemeSkin>
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-display">
        <Navbar />

        {/* Command bar — page context + global search/palette trigger + live
            system status. Sits below the shared Navbar rather than replacing
            it, so account/logout stays exactly where it already works. */}
        <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-xl">
          <div className="px-4 sm:px-8 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-1.5 w-1.5 rounded-full bg-verdict-accept shrink-0" aria-hidden="true" />
              <span className="text-xs font-mono-ui uppercase tracking-widest text-[var(--muted-foreground)] truncate">
                Command Center / {pageTitle}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)]/60 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)] transition text-xs"
              >
                <Search size={13} />
                Search
                <span className="flex items-center gap-0.5 ml-1 text-[10px] text-[var(--muted-foreground)] border border-[var(--border-strong)] rounded px-1">
                  <Command size={9} />K
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="sm:hidden p-2 rounded-full border border-[var(--border)] text-[var(--muted-foreground)]"
                aria-label="Open search"
              >
                <Search size={15} />
              </button>

              <AttentionCenter />
              <SystemStatusPill />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          <aside className="lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--border)] bg-[var(--surface)]/60">
            <nav className="p-3 lg:p-4 overflow-x-auto lg:overflow-visible">
              {NAV_GROUPS.map((group) => (
                <NavGroup key={group.label} group={group} />
              ))}
            </nav>
          </aside>
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>

      {paletteOpen && <CommandPalette onClose={closePalette} commands={commands} />}
      <CommandCenterEntry />
    </ThemeSkin>
  );
}

export default AdminLayout;