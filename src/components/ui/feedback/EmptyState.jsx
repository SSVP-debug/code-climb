/**
 * EmptyState
 *
 * A reusable, zero-business-logic empty state used anywhere data is absent:
 * Profile, Dashboard, Analytics, Recruiter Portal, Company Portal, future pages.
 *
 * Props
 * ─────
 * icon          ReactNode   — emoji string, SVG, or icon component (required)
 * title         string      — short heading, e.g. "No submissions yet" (required)
 * description   string      — supporting sentence below the title (required)
 * actionLabel   string      — CTA button label (optional)
 * onAction      () => void  — called when the CTA button is clicked (optional)
 * actionHref    string      — if provided, renders an <a> instead of <button> (optional)
 * compact       boolean     — reduces vertical padding for use inside small cards (optional)
 *
 * Notes
 * ─────
 * • Zero hardcoded text — all copy comes from props.
 * • When both `onAction` and `actionHref` are provided, `actionHref` wins
 *   (renders a link, safer default for navigation).
 * • `compact` mode halves py-16 → py-8 and removes the icon's large margin,
 *   useful inside SectionCard bodies that are already padded.
 */

function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  compact = false,
}) {
  const hasAction = actionLabel && (onAction || actionHref);

  const containerClass = compact
    ? "flex flex-col items-center text-center py-8 px-4"
    : "flex flex-col items-center text-center py-16 px-4";

  const iconClass = compact ? "text-3xl mb-3" : "text-4xl mb-4";

  const actionClass =
    "mt-4 inline-flex items-center justify-center px-5 py-2.5 rounded-xl " +
    "bg-green-500 hover:bg-green-600 text-black font-semibold text-sm transition";

  return (
    <div className={containerClass}>
      {/* Icon */}
      <span className={iconClass} role="img" aria-hidden="true">
        {icon}
      </span>

      {/* Title */}
      <p className="text-white font-semibold text-base">{title}</p>

      {/* Description */}
      <p className="text-zinc-500 text-sm mt-1 max-w-xs">{description}</p>

      {/* CTA */}
      {hasAction && (
        actionHref ? (
          <a href={actionHref} className={actionClass}>
            {actionLabel}
          </a>
        ) : (
          <button onClick={onAction} className={actionClass}>
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}

export default EmptyState;
