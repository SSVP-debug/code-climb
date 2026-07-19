function SectionCard({
  title,
  subtitle,
  icon,
  action,
  children,
  className = "",
  accented = false,
}) {
  const hasHeader = title || action;

  return (
    <div
      className={`relative overflow-hidden bg-zinc-900 rounded-2xl p-4 sm:p-6 border ${
        accented ? "border-[var(--theme-border,#27272a)]" : "border-zinc-800"
      } ${className}`}
    >
      {/* Top accent stripe — only when this card opts into the theme */}
      {accented && (
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--theme-primary,#2dd4bf)] to-[var(--theme-accent,#0d9488)]"
        />
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      {hasHeader && (
        <div className="flex items-start justify-between gap-3 mb-4">
          {/* Title group */}
          <div className="min-w-0 flex items-start gap-2.5">
            {icon && (
              <span
                className="text-lg leading-tight flex-shrink-0"
                style={accented ? { color: "var(--theme-primary, #2dd4bf)" } : undefined}
                aria-hidden="true"
              >
                {icon}
              </span>
            )}
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