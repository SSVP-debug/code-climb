import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../services/auth";
import { useContext, useState } from "react";
import { AuthContext } from "../context/authContext";
import { useTheme } from "../context/ThemeContext";
import { useAppContext } from "../hooks/useAppContext";

function Navbar() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const { currentStreak } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  const navLinks = [
    { to: "/dashboard", label: theme.words.dashboard },
    { to: "/problems",  label: theme.words.problems },
    { to: "/analytics", label: theme.words.analytics },
    { to: "/profile",   label: theme.words.profile },
  ];

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
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="hover:text-zinc-300 transition text-sm"
            >
              {link.label}
            </Link>
          ))}

          {/* ── Streak pill — always visible on desktop ─────────────────── */}
          {/* Duolingo's insight: streak visibility drives daily return.     */}
          {currentStreak > 0 && (
            <div
              className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1.5 rounded-full text-xs font-bold"
              title={`${currentStreak}-day streak! Keep it going.`}
            >
              <span className="text-sm">🔥</span>
              <span>{currentStreak}</span>
              <span className="text-orange-500/60 font-normal">
                {currentStreak === 1 ? "day" : "days"}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName ?? "User"}
                className="w-9 h-9 rounded-full border border-zinc-700"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-sm">
                {user?.displayName?.charAt(0)}
              </div>
            )}
            <div className="hidden md:block">
              <p className="font-semibold text-sm">{user?.displayName}</p>
              <p className="text-zinc-400 text-xs">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="bg-white text-black px-4 py-2 rounded-xl font-semibold hover:bg-zinc-200 transition text-sm"
          >
            Logout
          </button>
        </div>

        {/* Mobile: streak + avatar + hamburger */}
        <div className="flex lg:hidden items-center gap-3">
          {/* Streak on mobile — compact */}
          {currentStreak > 0 && (
            <span className="flex items-center gap-1 text-orange-400 text-sm font-bold">
              🔥 {currentStreak}
            </span>
          )}

          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName ?? "User"}
              className="w-8 h-8 rounded-full border border-zinc-700"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-sm">
              {user?.displayName?.charAt(0)}
            </div>
          )}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            className="p-2 rounded-lg hover:bg-zinc-800 transition"
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 4L16 16M16 4L4 16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="lg:hidden border-t border-zinc-800 bg-zinc-900 px-4 py-3 flex flex-col gap-1">
          {navLinks.map((link) => (
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
