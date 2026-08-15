import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../services/auth";
import { AuthContext } from "../context/AuthContextObject";

/**
 * Slim topbar for the problem detail page.
 * Height: h-10 (40px) — tight, coding-platform style.
 * Contains: ← back | problem title + prev/next | avatar + logout
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
    navigate("/login");
  };

  return (
    <header className="h-10 flex-shrink-0 flex items-center justify-between px-3 bg-ink-900 border-b border-ink-700 z-50">

      {/* Left: brand + back */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-white text-xs font-bold shrink-0">Code Club</span>
        <span className="text-zinc-700 text-xs shrink-0">·</span>
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
              ? "text-zinc-400 hover:text-white hover:bg-ink-800"
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
              ? "text-zinc-400 hover:text-white hover:bg-ink-800"
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
            className="w-6 h-6 rounded-full border border-ink-700"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-ink-700 flex items-center justify-center text-[10px] font-bold">
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