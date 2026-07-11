import { Link } from "react-router-dom";

/**
 * Button
 *
 * Single source of truth for the app's button styling. Before this
 * component, `bg-green-600 hover:bg-green-500` (or the inverted
 * `bg-green-500 hover:bg-green-600`) was duplicated verbatim across 17
 * files — changing the primary brand color meant a find-and-replace
 * across all of them. Now it's one file.
 *
 * Renders a <button> by default. Pass `to="/somewhere"` to render a
 * react-router <Link> instead (many "buttons" in this app are actually
 * navigation) — variant/size styling is identical either way.
 *
 * Variants:
 *   primary   — solid green, main call-to-action (was bg-green-600/500)
 *   secondary — zinc outline, secondary action
 *   danger    — solid red, destructive action
 *   ghost     — text-only, lowest emphasis
 *
 * Sizes: sm | md (default) | lg
 */

const VARIANT_CLASSES = {
  primary:
    "bg-green-600 hover:bg-green-500 text-white disabled:hover:bg-green-600",
  secondary:
    "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 disabled:hover:bg-zinc-800",
  danger:
    "bg-red-600 hover:bg-red-500 text-white disabled:hover:bg-red-600",
  ghost:
    "bg-transparent hover:bg-zinc-900 text-zinc-300 hover:text-white disabled:hover:bg-transparent",
};

const SIZE_CLASSES = {
  sm: "px-4 py-1.5 text-sm rounded-lg",
  md: "px-6 py-2.5 text-sm rounded-xl",
  lg: "px-8 py-3.5 text-base rounded-xl",
  xl: "px-10 py-4 text-base rounded-xl",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";

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