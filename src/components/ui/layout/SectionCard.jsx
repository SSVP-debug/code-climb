/**
 * SectionCard
 *
 * The single, canonical wrapper for every card-like section across Code Club.
 * Used on Profile, Dashboard, Analytics, Recruiter Portal, Company Portal,
 * and any future premium feature pages.
 *
 * Props
 * ─────
 * title       string          — section heading (required)
 * subtitle    string          — secondary line below the title (optional)
 * action      ReactNode       — right-aligned slot: badge, button, link, etc. (optional)
 * children    ReactNode       — body content (required)
 * className   string          — extra Tailwind classes appended to the outer wrapper (optional)
 *
 * Design decisions
 * ────────────────
 * • bg-zinc-900 / border-zinc-800 / rounded-2xl / p-6 match every existing
 *   card in the codebase so refactoring is a pure search-and-replace.
 * • Header is only rendered when `title` is provided — some callers may want
 *   a card without a header (e.g. the User Info card).
 * • `action` sits in a flex row beside the title group; it can hold anything:
 *   a <span> badge, a <button>, or a full JSX subtree.
 * • `className` is appended last so callers can override spacing when needed.
 */

function SectionCard({
  title,
  subtitle,
  action,
  children,
  className = "",
}) {
  const hasHeader = title || action;

  return (
    <div
      className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 ${className}`}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      {hasHeader && (
        <div className="flex items-start justify-between gap-3 mb-4">
          {/* Title group */}
          <div className="min-w-0">
            {title && (
              <h2 className="text-xl font-semibold text-white leading-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>
            )}
          </div>

          {/* Right-aligned action slot */}
          {action && (
            <div className="flex-shrink-0">{action}</div>
          )}
        </div>
      )}

      {/* ── Body ───────────────────────────────────────────────────────── */}
      {children}
    </div>
  );
}

export default SectionCard;