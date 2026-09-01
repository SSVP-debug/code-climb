import { RefreshCw, Home } from "lucide-react";

/**
 * GlobalErrorFallback — rendered by the top-level Sentry <ErrorBoundary/>
 * in main.jsx when a render error escapes every lower boundary.
 *
 * Fills a gap from the state-coverage audit: the previous fallback was a
 * static "Something went wrong. Our team has been notified." with no way
 * out short of the user manually finding the browser's reload button —
 * a dead end, not a recovery state. This gives the two actions that
 * actually get someone unstuck:
 *   - Reload the page (clears whatever bad render state caused the crash)
 *   - Go to the dashboard (in case the crash is tied to the current route
 *     specifically, reloading in place would just crash again)
 *
 * Kept intentionally dependency-free (no router, no context, no hooks
 * beyond what's here) — this renders in the worst-case scenario where
 * something upstream (context providers included, since the boundary sits
 * inside them) may already be broken, so it can't assume any of that is
 * safe to reach into.
 */
function GlobalErrorFallback() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-5">
        <p className="text-lg font-semibold">Something went wrong.</p>
        <p className="text-[var(--muted-foreground)] text-sm">
          Our team has been notified. You can try reloading, or head back to
          your dashboard.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-sm font-semibold px-4 py-2.5 hover:opacity-90 transition"
          >
            <RefreshCw size={15} strokeWidth={2} aria-hidden="true" />
            Reload page
          </button>
          <a
            href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] text-[var(--muted-foreground)] text-sm font-medium px-4 py-2.5 hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition"
          >
            <Home size={15} strokeWidth={2} aria-hidden="true" />
            Go to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export default GlobalErrorFallback;
