import { RefreshCw, X } from "lucide-react";

/**
 * ErrorBanner — inline error message used throughout the code workspace
 * (run/submit failures, hint fetch failures, etc.)
 *
 * `onRetry` and `onDismiss` are both optional so every existing call site
 * that only ever passed `message` keeps working unchanged — this stays a
 * plain read-only banner unless a caller opts into the extra affordances.
 * Filled gap from the state-coverage audit: previously this was a dead
 * end (message only, no way to act on it) even though the underlying
 * operation — e.g. useRunCode's `run()` — is trivially re-callable.
 */
export default function ErrorBanner({
  message,
  onRetry,
  retryLabel = "Retry",
  onDismiss,
}) {
  if (!message) return null;

  return (
    <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-xl flex items-start gap-3">
      <p className="flex-1 min-w-0">{message}</p>

      {(onRetry || onDismiss) && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-1.5 text-xs font-medium text-red-300 hover:text-red-100 border border-red-500/40 rounded-full px-3 py-1 transition"
            >
              <RefreshCw size={12} strokeWidth={2} aria-hidden="true" />
              {retryLabel}
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss error"
              className="text-red-400 hover:text-red-200 transition"
            >
              <X size={15} strokeWidth={2} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
