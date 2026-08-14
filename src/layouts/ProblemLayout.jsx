import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../services/auth";
import { AuthContext } from "../context/authContext";

/**
 * Slim topbar for the problem detail page.
 * Height: h-10 (40px) — tight, coding-platform style.
 * Contains: Code Club mark | ← back | problem title + prev/next | avatar + logout
 *
 * Navbar transformation, Phase B: this used to be the one shell in the
 * whole app on the "ink" border/surface palette (ink-900/ink-700) while
 * every other role's shell (Navbar, ProblemsTopbar) is on zinc — and it
 * carried no "Code Club" mark at all, so landing here from anywhere else
 * in the product genuinely looked like a different site. Both fixed below.
 * Height and the minimal avatar+logout (vs the full AvatarDropdown menu)
 * stay as-is on purpose — this page's whole point is a focused,
 * low-distraction workspace while solving, not another surface for XP/
 * streak/quick-action chrome.
 *
 * Props:
 *   title      — current problem title string
 *   prevSlug   — slug string or null
 *   nextSlug   — slug string or null
 */
function ProblemTopbar({ title, prevSlug, nextSlug }) {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const handleLogout = async () => {
    await logoutUser();
    // Matches Navbar's handleLogout: real, honest post-logout feedback on
    // the login page (not fabricated), driven by a flag LoginPage already
    // reads — this page just wasn't setting it before.
    navigate("/login?loggedOut=1");
  };

  return (
    <header className="h-10 flex-shrink-0 flex items-center justify-between px-3 bg-zinc-900 border-b border-zinc-800 z-50">

      {/* Left: brand + back */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-white text-xs font-bold tracking-tight shrink-0 hidden sm:inline">
          Code Club
        </span>
        <span className="text-zinc-700 text-xs shrink-0 hidden sm:inline">·</span>
        <Link
          to="/problems"
          className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition text-xs font-mono-ui shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Problems
        </Link>

        <span className="text-zinc-700 text-xs shrink-0">·</span>

        <span className="text-white text-xs font-semibold truncate max-w-[280px]">
          {title}
        </span>
      </div>

      {/* Center: prev / next */}
      <div className="flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
        <Link
          to={prevSlug ? `/problems/${prevSlug}` : "#"}
          aria-disabled={!prevSlug}
          className={`p-1.5 rounded-lg transition ${
            prevSlug
              ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
              : "text-zinc-700 pointer-events-none"
          }`}
          title="Previous problem"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <Link
          to={nextSlug ? `/problems/${nextSlug}` : "#"}
          aria-disabled={!nextSlug}
          className={`p-1.5 rounded-lg transition ${
            nextSlug
              ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
              : "text-zinc-700 pointer-events-none"
          }`}
          title="Next problem"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      {/* Right: avatar + logout */}
      <div className="flex items-center gap-2 shrink-0">
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt="avatar"
            className="w-6 h-6 rounded-full border border-zinc-700"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold">
            {user?.displayName?.charAt(0)}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="text-xs text-zinc-400 hover:text-white transition font-mono-ui"
        >
          Logout
        </button>
      </div>

    </header>
  );
}

/**
 * Full-page layout for the problem detail page.
 * Renders the slim topbar then a flex-col fill for the panels below.
 */
function ProblemLayout({ children, title, prevSlug, nextSlug }) {
  return (
    <div className="h-screen flex flex-col bg-ink-950 text-white font-display overflow-hidden">
      <ProblemTopbar title={title} prevSlug={prevSlug} nextSlug={nextSlug} />
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export default ProblemLayout;