import { Link } from "react-router-dom";
import Button from "../ui/Button";
import BWModeToggle from "../common/BWModeToggle";

/**
 * Global landing navbar — Phase 3B.
 *
 * Sticky + blurred rather than static-in-flow: the redesigned Hero below
 * is taller and single-column now, so keeping the primary CTA reachable
 * while scrolling matters more than it did with the old two-column Hero.
 * The blur/translucency is a one-line CSS treatment (no scroll listener,
 * no new state) — it reads as "elevated" without adding a second
 * scroll-driven animation system alongside the page's existing
 * scroll-reveal one.
 *
 * The Black & White Mode switch (shared, platform-wide — see
 * BWModeToggle/useBWMode, untouched here) now sits inside its own small
 * bordered pill instead of floating bare between the nav links and the
 * CTA, so it reads as a deliberate control in the nav's system rather
 * than a loose switch that wandered in.
 *
 * Auth-aware destinations/labels (Problems, Dashboard vs. Portal) are
 * unchanged from the pre-redesign version — only the visual treatment
 * changed. "Problems" is hidden below `sm` rather than wrapping or
 * crowding the CTA on narrow viewports (Phase 1 audit flagged this as
 * the nav's one responsive risk); the route stays reachable via the
 * primary CTA and the footer either way.
 *
 * Surfaces/text below use the semantic theme tokens from index.css
 * (--background/--foreground/--border/--muted-foreground/--accent-text)
 * so this bar renders correctly in both Black and White Mode; see
 * index.css for what each resolves to per mode.
 */
function LandingNav({ user }) {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/80 px-6 py-4 backdrop-blur-md md:px-12">
      <Link
        to="/"
        className="flex items-center font-display text-lg font-semibold tracking-tight text-[var(--foreground)]"
      >
        Code Club
        <span className="text-[var(--accent-text)]">.</span>
      </Link>

      <div className="flex items-center gap-2 md:gap-4">
        <Link
          to={user ? "/problems" : "/login?role=student"}
          className="hidden px-3 py-2 text-sm text-[var(--muted-foreground)] transition hover:text-[var(--foreground)] sm:inline-block"
        >
          Problems
        </Link>

        <div className="rounded-full border border-[var(--border)] bg-[var(--surface)]/60 p-1">
          <BWModeToggle />
        </div>

        <Button to={user ? "/dashboard" : "/portal"} variant="theme" size="sm">
          {user ? "Dashboard →" : "Get Started"}
        </Button>
      </div>
    </nav>
  );
}

export default LandingNav;