import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../services/auth";
import { useContext, useState } from "react";
import { AuthContext } from "../context/authContext";
import { useTheme } from "../context/ThemeContext";
import { useAppContext } from "../hooks/useAppContext";
import AvatarDropdown from "./AvatarDropdown";
import StreakBadge from "./common/StreakBadge";

function Navbar() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const { currentStreak, role } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  const navigation = {
    student: {
      primary: [
        { to: "/dashboard", label: theme.words.dashboard },
        { to: "/problems", label: theme.words.problems },
        { to: "/leaderboard", label: "Leaderboard" },
      ],
      secondary: [
        { to: "/analytics", label: theme.words.analytics },
        { to: "/contests", label: "Contests" },
        { to: "/certifications", label: "Certifications" },
        { to: "/ambassador", label: "Ambassador" },
        { to: "/recruiter/signup", label: "Recruiters" },
        { to: "/pricing", label: "Pricing" },
      ],
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
        { to: "/dashboard", label: "Admin" },
      ],
      secondary: [],
    },
  };

  const nav = navigation[role] ?? navigation.student;
  console.log("Role:", role);
  console.log(nav);
  return (
    <nav className="bg-zinc-900 text-white border-b border-zinc-800 relative z-50">
      <div className="px-4 sm:px-8 py-4 flex items-center justify-between">

        {/* Brand */}
        <div className="flex flex-col">
          <span className="text-xl sm:text-2xl font-bold">Code Club</span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
            {theme.name}
          </span>
        </div>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-6">
          {nav.primary.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="hover:text-zinc-300 transition text-sm"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-4 border-l border-zinc-800 pl-4 ml-2">
            {nav.secondary.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-zinc-400 hover:text-white transition"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <StreakBadge
            streak={currentStreak}
            size="sm"
          />

          <AvatarDropdown
            user={user}
            onLogout={handleLogout}
          />
        </div>

        {/* Mobile: streak + avatar + hamburger */}
        <div className="flex lg:hidden items-center gap-3">
          <StreakBadge
            streak={currentStreak}
            size="sm"
          />
          

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
          {[...nav.primary, ...nav.secondary].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="py-2.5 px-3 rounded-xl hover:bg-zinc-800 transition text-sm text-zinc-300"
            >
              {link.label}
            </Link>
          ))}
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