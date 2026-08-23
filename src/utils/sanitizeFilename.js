/**
 * sanitizeFilename.js — makes a string safe to use as a filename across
 * Windows/macOS/Linux: replaces anything that isn't a letter, digit, or
 * hyphen with a hyphen (so "CC/027" becomes "CC-027" rather than losing
 * the separator entirely), collapses repeated hyphens, and caps length so
 * a very long opportunity title can't produce an unwieldy filename.
 */
export function sanitizeFilename(str, maxLength = 80) {
  return (
    (str || "")
      .replace(/[^a-zA-Z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, maxLength) || "file"
  );
}
