import { AlertTriangle, RefreshCw } from "lucide-react";
import EmptyState from "./EmptyState";

/**
 * AsyncState — generalizes the loading/error/empty/success pattern first
 * built for admin analytics (AnalyticsSection.jsx) and the admin dashboard
 * metrics (DashboardMetricsSection.jsx) into a shared, app-wide wrapper.
 *
 * That pattern was doing the right thing but only existed in two admin
 * surfaces; everywhere else either collapsed "still loading" and "the API
 * failed" into the same fallback, or had no error/retry state at all (see
 * the state-coverage audit). This is the fix: one component, five states,
 * used the same way anywhere data is fetched.
 *
 * States (checked in this order):
 *   1. loading  → `loadingFallback` if provided, else a pulsing skeleton
 *                 block sized by `loadingHeight`
 *   2. error    → warning banner with the message, plus a Retry button
 *                 whenever `onRetry` is passed (recovery state)
 *   3. empty    → `EmptyState` if `emptyTitle`/`emptyDescription` are
 *                 given, else `emptyFallback`, else a plain text row
 *   4. children → the real, loaded content (success state)
 *
 * Deliberately does NOT track its own loading/error/data — those stay
 * owned by whatever hook does the fetching (useFetchState-style hooks,
 * or ad-hoc useState in a page). This only renders the right branch.
 *
 * Props
 * ─────
 * loading          boolean
 * error            string | Error | null | undefined — any truthy value
 *                  renders the error branch; strings/Error.message are
 *                  shown, anything else falls back to a generic message
 * onRetry          () => void — optional; shows a Retry button when set
 * empty            boolean — whether there's no data to show once loaded
 * emptyIcon/emptyTitle/emptyDescription/emptyActionLabel/emptyOnAction
 *                  — passed straight through to EmptyState when
 *                  emptyTitle is provided
 * emptyFallback    ReactNode — used instead of EmptyState when no
 *                  emptyTitle is given (e.g. a one-line "No data yet.")
 * loadingFallback  ReactNode — replaces the default skeleton block
 * loadingHeight    string — Tailwind height class for the default
 *                  skeleton (default "h-40")
 * errorMessage     string — overrides the derived error text entirely
 */
function AsyncState({
  loading,
  error,
  onRetry,
  empty,
  emptyIcon = "📭",
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  emptyOnAction,
  emptyFallback,
  loadingFallback,
  loadingHeight = "h-40",
  errorMessage,
  children,
}) {
  if (loading) {
    return (
      loadingFallback || (
        <div
          className={`${loadingHeight} rounded-xl bg-zinc-900/60 border border-zinc-800 animate-pulse`}
        />
      )
    );
  }

  if (error) {
    const message =
      errorMessage ||
      (typeof error === "string" ? error : error?.message) ||
      "Couldn't load this data.";

    return (
      <div className="rounded-xl border border-verdict-reject/25 bg-verdict-reject/5 px-4 py-3.5 flex items-center justify-between gap-3 flex-wrap">
        <span className="flex items-center gap-2.5 text-sm text-verdict-reject">
          <AlertTriangle size={15} className="shrink-0" aria-hidden="true" />
          {message}
        </span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 text-xs font-medium text-verdict-reject hover:text-red-200 border border-verdict-reject/40 rounded-full px-3 py-1 transition shrink-0"
          >
            <RefreshCw size={11} aria-hidden="true" />
            Retry
          </button>
        )}
      </div>
    );
  }

  if (empty) {
    if (emptyTitle) {
      return (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={emptyOnAction}
          compact
        />
      );
    }

    return (
      emptyFallback || (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3.5 text-sm text-zinc-500">
          No data yet.
        </div>
      )
    );
  }

  return children;
}

export default AsyncState;
