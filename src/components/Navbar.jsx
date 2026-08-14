import { Link, useNavigate, useLocation } from "react-router-dom";
import { logoutUser } from "../services/auth";
import { lazy, Suspense, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/authContext";
import { useTheme } from "../context/ThemeContext";
import { useAppContext } from "../hooks/useAppContext";
import { Search, Command } from "lucide-react";
import AvatarDropdown from "./AvatarDropdown";
import StreakBadge from "./common/StreakBadge";
import NotificationBell from "./notifications/NotificationBell";
import WorkspaceSwitcher from "./nav/WorkspaceSwitcher";
import { getWorkspace } from "../config/workspaces";
import { buildRoleCommands } from "../config/roleCommands";

// Dynamic import: CommandPalette (and its icon set) only needs to load
// once someone actually opens search — every other page render of the
// shared Navbar shouldn't pay for it. Same reasoning as AvatarDropdown's
// goToRandomProblem/daily-challenge dynamic imports.
const CommandPalette = lazy(() => import("./admin/command/CommandPalette"));

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const { currentStreak, role } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Theme coloring is student-only (Phase 11, decision #2) — Navbar is
  // shared across roles (Admin Console renders it too via DashboardLayout),
  // so this is checked explicitly rather than assumed from ThemeSkin's
  // presence.
  const isStudentThemed = role === "student";

  // Navbar transformation, Phase C: Cmd/Ctrl+K search, wired here for
  // student/recruiter/tpo — the three roles that never had search at all.
  // Deliberately excluded for admin: AdminLayout already owns a richer
  // Cmd/Ctrl+K + command list (live pending-approval counts, system
  // health), and binding a second listener here would fire both at once.
  // "Do not create multiple competing search systems" (spec §16).
  const searchEnabled = role !== "admin";

  useEffect(() => {
    if (!searchEnabled) return undefined;
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchEnabled]);

  const commands = useMemo(() => {
    if (!searchEnabled) return [];
    return buildRoleCommands({ role, theme, navigate });
  }, [searchEnabled, role, theme, navigate]);

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleLogout = async () => {
    await logoutUser();
    // JARVIS pass, spec §19: "provide subtle session-ended feedback" —
    // real feedback tied to the actual completed logout (this line only
    // runs after logoutUser() resolves), not a fabricated shutdown
    // animation. LoginPage reads this flag to show a one-line confirmation,
    // same treatment as its existing sessionExpired banner.
    navigate("/login?loggedOut=1");
  };

  const navigation = {
    student: {
      primary: [
        { to: "/dashboard", label: theme.words.dashboard },
        { to: "/problems", label: theme.words.problems },
        { to: "/club", label: "Club" },
      ],
      // Analytics & Certifications now live inside Profile (avatar → View Profile).
      // Leaderboard, Contests & Ambassador now live inside Club, above.
      // Recruiters stay discoverable from the landing page footer; Pricing
      // stays one tap away in the avatar menu — neither needs a seat here.
      secondary: [],
    },

    recruiter: {
      primary: [
        { to: "/recruiter/dashboard", label: "Candidates" },
        { to: "/candidate/tests", label: "Tests" },
      ],
      secondary: [
        { to: "/profile", label: theme.words.profile },
      ],
    },

    tpo: {
      primary: [
        { to: "/tpo/dashboard", label: "Dashboard" },
      ],
      secondary: [
        { to: "/profile", label: theme.words.profile },
      ],
    },

    admin: {
      primary: [
        { to: "/admin", label: "Admin Console" },
      ],
      // Cross-workspace navigation (Student/Recruiter/TPO) now lives in
      // WorkspaceSwitcher, in the brand block — this list would just be a
      // second, redundant way to do the same thing (Navbar transformation,
      // Phase A).
      secondary: [],
    },
  };

  const nav = navigation[role] ?? navigation.student;
  return (
    <nav className="bg-zinc-900/95 backdrop-blur-md text-white border-b border-zinc-800/80 shadow-[0_1px_0_0_rgba(0,0,0,0.4)] relative z-50">
      <div className="px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3">

        {/* Brand — "Code Club" plus a workspace-context line underneath, so
            no role ever wonders which environment it's in (Navbar
            transformation, spec §6). Student keeps its existing theme-name
            personality treatment (Code Heist etc.) since that already
            doubles as its workspace context — there's only one student
            workspace, so it needs no switcher. Admin gets the actual
            switcher, since it's the one role with real cross-workspace
            links today. Recruiter/TPO get a plain label: honest, since
            those accounts can't switch workspaces either.
            min-w-0 + truncate: flex items default to min-width:auto, so
            without this the brand block can force the mobile icon row off
            the right edge into horizontal overflow instead of shrinking
            (Navbar transformation, Phase E). */}
        <div className="flex flex-col min-w-0">
          <span className="text-xl sm:text-2xl font-bold truncate">Code Club</span>
          {isStudentThemed ? (
            <span className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-widest truncate">
              <span
                aria-hidden="true"
                className="w-1.5 h-1.5 rounded-full bg-[var(--theme-primary,#2dd4bf)] shrink-0"
              />
              <span className="truncate">{theme.name}</span>
            </span>
          ) : role === "admin" ? (
            <WorkspaceSwitcher activeRole={role} />
          ) : (
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest truncate">
              {getWorkspace(role).label}
            </span>
          )}
        </div>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-6">
          {nav.primary.map((link) => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                aria-current={active ? "page" : undefined}
                className={`relative pb-1 text-sm transition ${
                  active
                    ? "text-white font-medium"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {link.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 right-0 -bottom-1 h-0.5 rounded-full ${
                      isStudentThemed ? "bg-[var(--theme-primary,#2dd4bf)]" : "bg-white"
                    }`}
                  />
                )}
              </Link>
            );
          })}
          {nav.secondary.length > 0 && (
            <div className="flex items-center gap-4 border-l border-zinc-800 pl-4 ml-2">
              {nav.secondary.map((link) => {
                const active = isActive(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    aria-current={active ? "page" : undefined}
                    className={`text-sm transition ${
                      active ? "text-white font-medium" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}

          {searchEnabled && (
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:text-white hover:border-zinc-700 transition text-xs"
            >
              <Search size={13} />
              Search
              <span className="flex items-center gap-0.5 ml-1 text-[10px] text-zinc-600 border border-zinc-700 rounded px-1">
                <Command size={9} />K
              </span>
            </button>
          )}

          <StreakBadge
            streak={currentStreak}
            size="sm"
          />

          {/* Navbar transformation, Phase D: NotificationBell is the
              student-facing achievement/activity feed (documented in
              AttentionCenter's own comment) — admin accounts never
              receive that notification type on the backend (verified:
              no createNotification call anywhere targets an admin
              recipient), so this would only ever render a permanently
              empty bell sitting right next to AdminLayout's real
              AttentionCenter. Recruiter/TPO keep it — they do receive
              real notifications (recruiter_verified, tpo_verified, etc.
              from adminController.js). */}
          {role !== "admin" && <NotificationBell />}

          <AvatarDropdown
            user={user}
            onLogout={handleLogout}
          />
        </div>

        {/* Mobile: search + streak + bell + avatar + hamburger.
            shrink-0: these are the essential controls (§21) — the brand
            block truncates before this row ever gets squeezed. Streak
            pill is hidden below ~380px (older/smaller phones): it's the
            one item here that's genuinely optional chrome, not core nav
            (Navbar transformation, Phase E). */}
        <div className="flex lg:hidden items-center gap-2 sm:gap-3 shrink-0">
          {searchEnabled && (
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label="Open search"
              className="p-2 rounded-lg hover:bg-zinc-800 transition text-zinc-400"
            >
              <Search size={16} />
            </button>
          )}

          <div className="hidden min-[380px]:block">
            <StreakBadge
              streak={currentStreak}
              size="sm"
            />
          </div>

          {role !== "admin" && <NotificationBell />}

          <AvatarDropdown
            user={user}
            onLogout={handleLogout}
            mobile
          />
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            className="p-2 rounded-lg hover:bg-zinc-800 transition"
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 4L16 16M16 4L4 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="lg:hidden border-t border-zinc-800 bg-zinc-900 px-4 py-3 flex flex-col gap-1">
          {[...nav.primary, ...nav.secondary].map((link) => {
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`py-2.5 px-3 rounded-xl transition text-sm border-l-2 ${
                  active
                    ? "bg-zinc-800 text-white font-medium"
                    : "border-transparent hover:bg-zinc-800 text-zinc-300"
                }`}
                style={{
                  borderLeftColor: active
                    ? isStudentThemed
                      ? "var(--theme-primary, #2dd4bf)"
                      : "#ffffff"
                    : "transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="border-t border-zinc-800 mt-2 pt-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{user?.displayName}</p>
              <p className="text-zinc-400 text-xs">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white text-black px-4 py-2 rounded-xl font-semibold hover:bg-zinc-200 transition text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {searchEnabled && paletteOpen && (
        <Suspense fallback={null}>
          <CommandPalette onClose={() => setPaletteOpen(false)} commands={commands} />
        </Suspense>
      )}
    </nav>
  );
}

export default Navbar;