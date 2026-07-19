import { Link, useNavigate, useLocation } from "react-router-dom";
import { logoutUser } from "../services/auth";
import { useContext, useState } from "react";
import { AuthContext } from "../context/authContext";
import { useTheme } from "../context/ThemeContext";
import { useAppContext } from "../hooks/useAppContext";
import AvatarDropdown from "./AvatarDropdown";
import StreakBadge from "./common/StreakBadge";
import NotificationBell from "./notifications/NotificationBell";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const { currentStreak, role } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);

  // Theme coloring is student-only (Phase 11, decision #2) — Navbar is
  // shared across roles (Admin Console renders it too via DashboardLayout),
  // so this is checked explicitly rather than assumed from ThemeSkin's
  // presence.
  const isStudentThemed = role === "student";

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
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
      secondary: [
        { to: "/dashboard", label: "Student" },
        { to: "/recruiter/dashboard", label: "Recruiter" },
        { to: "/tpo/dashboard", label: "TPO" },
      ],
    },
  };

  const nav = navigation[role] ?? navigation.student;
  return (
    <nav className="bg-zinc-900 text-white border-b border-zinc-800 relative z-50">
      <div className="px-4 sm:px-8 py-4 flex items-center justify-between">

        {/* Brand */}
        <div className="flex flex-col">
          <span className="text-xl sm:text-2xl font-bold">Code Club</span>
          {isStudentThemed && (
            <span className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-widest">
              <span
                aria-hidden="true"
                className="w-1.5 h-1.5 rounded-full bg-[var(--theme-primary,#2dd4bf)]"
              />
              {theme.name}
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

          <StreakBadge
            streak={currentStreak}
            size="sm"
          />

          <NotificationBell />

          <AvatarDropdown
            user={user}
            onLogout={handleLogout}
          />
        </div>

        {/* Mobile: streak + bell + avatar + hamburger */}
        <div className="flex lg:hidden items-center gap-3">
          <StreakBadge
            streak={currentStreak}
            size="sm"
          />

          <NotificationBell />
          

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
    </nav>
  );
}

export default Navbar;