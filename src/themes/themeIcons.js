import { Vault, FlaskConical, Terminal, Triangle, Rocket, Compass } from "lucide-react";

/**
 * THEME_ICONS — one lucide icon per story universe, chosen to match the
 * fictional world rather than being interchangeable glyphs:
 *   codeHeist      → Vault      (crack the vault)
 *   breakingBug    → FlaskConical (Breaking Bad-style lab)
 *   ghostProtocol  → Terminal   (Mr. Robot-style hacker terminal)
 *   survivalCode   → Triangle   (Squid Game guard-rank shape)
 *   debugDynasty   → Rocket     (Silicon Valley "ship fast")
 *
 * Shared across the theme-selection flow (ThemeSelectionPage,
 * ThemeConfirmationPage) and, as of Phase 11B, student-facing pages that
 * render theme-aware UI (Dashboard, Club, Problems, Profile) — one map,
 * so the same universe always shows the same icon everywhere it appears.
 */
export const THEME_ICONS = {
  codeHeist: Vault,
  breakingBug: FlaskConical,
  ghostProtocol: Terminal,
  survivalCode: Triangle,
  debugDynasty: Rocket,
};

/**
 * DEFAULT_THEME_ICON — fallback for "no theme selected" (id: "default"),
 * which intentionally has no entry in THEME_ICONS above since it isn't a
 * story universe. `Compass` was chosen for the same reason as the other
 * icons: it reads as "find your way / get oriented," not a generic filler
 * glyph — fitting for the neutral, no-roleplay experience.
 */
export const DEFAULT_THEME_ICON = Compass;

/**
 * Appends an alpha channel to a 6-digit hex color.
 * withAlpha("#22c55e", "26") -> "#22c55e26" (~15% opacity)
 */
export function withAlpha(hex, alphaHex) {
  return `${hex}${alphaHex}`;
}