import { Link } from "react-router-dom";
const VARIANT_CLASSES = {
  primary:
    "bg-[var(--theme-primary,#2dd4bf)] hover:brightness-110 text-[#09090b] disabled:hover:brightness-100",
  secondary:
    "bg-[var(--surface-elevated)] hover:brightness-110 text-[var(--foreground)] border border-[var(--border-strong)] disabled:hover:brightness-100",
  danger:
    "bg-red-600 hover:bg-red-500 text-white disabled:hover:bg-red-600",
  ghost:
    "bg-transparent hover:bg-[var(--surface-elevated)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:hover:bg-transparent",
  theme:
    "bg-[var(--theme-primary,#2dd4bf)] hover:brightness-110 text-[#09090b] disabled:hover:brightness-100",
};

const SIZE_CLASSES = {
  sm: "px-4 py-1.5 text-sm rounded-lg",
  md: "px-6 py-2.5 text-sm rounded-xl",
  lg: "px-8 py-3.5 text-base rounded-xl",
  xl: "px-10 py-4 text-base rounded-xl",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary,#2dd4bf)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]";

function Button({
  variant = "primary",
  size = "md",
  to,
  href,
  className = "",
  disabled = false,
  loading = false,
  children,
  ...rest
}) {
  const classes = [
    BASE_CLASSES,
    VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary,
    SIZE_CLASSES[size] || SIZE_CLASSES.md,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  );
}

export default Button;