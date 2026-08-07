import { NavLink, Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import ThemeSkin from "../themes/ThemeSkin";
import {
  LayoutDashboard,
  Users,
  Building2,
  ListChecks,
  BarChart3,
  Activity,
  ScrollText,
  Settings,
} from "lucide-react";

// Plan 001: dedicated admin layout — own sidebar/nav, distinct from the
// student/recruiter/TPO DashboardLayout (which has theming hooks and
// premium-feature gating that have nothing to do with admin work).
// "Isolated" per the confirmed decision means its own layout/nav, not a
// separate auth system — Navbar (and its role-aware admin menu) stays.
const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/colleges", label: "Colleges", icon: Building2 },
  { to: "/admin/problems", label: "Problems", icon: ListChecks },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/system-health", label: "System Health", icon: Activity },
  { to: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function AdminLayout() {
  return (
    <ThemeSkin>
      <div className="min-h-screen bg-ink-950 text-white font-display">
        <Navbar />
        <div className="flex flex-col lg:flex-row">
          <aside className="lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-800 bg-zinc-950/60">
            <nav className="p-3 lg:p-4 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                      isActive
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                    }`
                  }
                >
                  <Icon size={16} strokeWidth={2} aria-hidden="true" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </aside>
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </ThemeSkin>
  );
}

export default AdminLayout;