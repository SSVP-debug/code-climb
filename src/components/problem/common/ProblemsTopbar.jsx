import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AuthContext } from "../../../context/AuthContextObject";
import { useTheme } from "../../../hooks/useTheme";
import { logoutUser } from "../../../services/auth";
import HoverTooltip from "../../ui/HoverTooltip";

function ProblemsTopbar({ totalProblems = 0, solvedCount = 0, progress = 0 }) {
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  const navLinks = [
    { to: "/analytics", label: theme.words.analytics },
    { to: "/profile",   label: theme.words.profile   },
  ];

  return (
    <>
      {/* ── Topbar ── */}
      <header className="h-14 flex-shrink-0 flex items-center gap-4 px-5 bg-[var(--surface)] border-b border-[var(--border)] z-40">

        {/* Back to Dashboard — the direct "way out". One click, always
            visible, no drawer required. Icon-only with a hover tooltip
            on sm+ (same interaction as the collapsed sidebar); sm and
            below keep the label visible since there's no hover on touch
            and screen space is tighter to spare for a tooltip anyway. */}
        <HoverTooltip label={`Back to ${theme.words.dashboard}`}>
          <Link
            to="/dashboard"
            aria-label={`Back to ${theme.words.dashboard}`}
            className="flex-shrink-0 flex items-center gap-1.5 p-2 sm:p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)] transition"
          >
            <ArrowLeft size={18} strokeWidth={2} />
            <span className="sm:hidden text-sm font-medium">{theme.words.dashboard}</span>
          </Link>
        </HoverTooltip>

        {/* Brand — always visible */}
        <div className="flex flex-col leading-tight flex-shrink-0">
          <span className="text-base font-bold tracking-tight">Code Club</span>
          <span className="text-[9px] text-[var(--muted-foreground)] uppercase tracking-widest">
            {theme.name}
          </span>
        </div>

        {/* Divider — hidden on mobile since the chip row scrolls independently */}
        <div className="hidden sm:block h-6 w-px bg-[var(--border-strong)] flex-shrink-0" />

        {/* Stat chips — horizontally scrollable so 4 chips never force page
            overflow or get crushed below their min-width on narrow screens */}
        <div className="flex items-center gap-2 flex-1 overflow-x-auto no-scrollbar">
          {/* Audit fix: these were hardcoded "Vaults"/"Cleared" — the Code
              Heist theme's own vocabulary — baked directly into this
              component, so every other theme's users (Breaking Bug, Ghost
              Protocol, Survival Code, Debug Dynasty, default) saw
              Code-Heist-flavored labels no matter which universe they'd
              actually selected. theme.words.* is populated for every
              theme (verified), same pattern used elsewhere in the app. */}
          <StatChip label={theme.words.problems}    value={totalProblems} />
          <StatChip label={theme.words.totalSolved} value={solvedCount} />
          <StatChip
            label="Progress"
            value={`${progress}%`}
            highlight={progress > 0}
          />

          {/* Streak chip — placeholder, wire up when streak API exists */}
          <StatChip label="Streak" value="—" />
        </div>

        {/* Right: user info + avatar + hamburger */}
        <div className="flex items-center gap-3 flex-shrink-0">

          {/* User name — visible md+ */}
          <div className="hidden md:flex flex-col items-end leading-tight">
            <span className="text-xs font-semibold text-[var(--foreground)]">
              {user?.displayName}
            </span>
            <span className="text-[10px] text-[var(--muted-foreground)]">{user?.email}</span>
          </div>

          {/* Avatar */}
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="avatar"
              className="w-8 h-8 rounded-full border border-[var(--border-strong)] flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center text-xs font-bold flex-shrink-0">
              {user?.displayName?.charAt(0)}
            </div>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setDrawerOpen((o) => !o)}
            aria-label="Open menu"
            className="p-2 rounded-lg hover:bg-[var(--surface-elevated)] transition text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            {drawerOpen ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 3L15 15M15 3L3 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2.5 4.5h13M2.5 9h13M2.5 13.5h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            )}
          </button>

        </div>
      </header>

      {/* ── Slide-in drawer ── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer panel */}
          <aside className="fixed top-0 right-0 h-full w-72 z-50 bg-[var(--surface)] border-l border-[var(--border)] flex flex-col shadow-2xl">

            {/* User header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="avatar" className="w-9 h-9 rounded-full border border-[var(--border-strong)]" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center text-sm font-bold">
                    {user?.displayName?.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm">{user?.displayName}</p>
                  <p className="text-[var(--muted-foreground)] text-xs">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-elevated)] transition text-[var(--muted-foreground)]"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
              <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] px-3 mb-2">
                More
              </p>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--foreground)] hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)] transition"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Stats in drawer */}
            <div className="px-5 py-4 border-t border-[var(--border)]">
              <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
                Your Stats
              </p>
              <div className="grid grid-cols-3 gap-2">
                <StatChip label={theme.words.problems}    value={totalProblems} />
                <StatChip label={theme.words.totalSolved} value={solvedCount} />
                <StatChip label="Progress" value={`${progress}%`} highlight={progress > 0} />
              </div>
            </div>

            {/* Logout */}
            <div className="px-5 py-4 border-t border-[var(--border)]">
              <button
                onClick={handleLogout}
                className="w-full bg-[var(--foreground)] text-[var(--background)] px-4 py-2.5 rounded-xl font-semibold hover:opacity-90 transition text-sm"
              >
                Logout
              </button>
            </div>

          </aside>
        </>
      )}
    </>
  );
}

function StatChip({ label, value, highlight = false }) {
  const { theme } = useTheme();
  return (
    <div className="flex flex-col items-center bg-[var(--surface-elevated)]/80 border border-[var(--border-strong)]/50 rounded-lg px-3 py-1.5 min-w-[58px]">
      {/* Audit fix: was hardcoded text-green-400 — off-brand, teal
          (var(--theme-primary)/theme.colors.primary) is the intentional
          accent color, green was never a deliberate choice. */}
      <span
        className="text-sm font-bold leading-none tabular-nums"
        style={{ color: highlight ? theme.colors.primary : "var(--foreground)" }}
      >
        {value}
      </span>
      <span className="text-[9px] text-[var(--muted-foreground)] uppercase tracking-wide mt-0.5 whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

export default ProblemsTopbar;