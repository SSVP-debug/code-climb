import { Vault, FlaskConical, Terminal, Triangle, Rocket } from "lucide-react";

/**
 * THEME_ICONS — one lucide icon per story universe, chosen to match the
 * fictional world rather than being interchangeable glyphs:
 *   codeHeist      → Vault      (crack the vault)
 *   breakingBug    → FlaskConical (Breaking Bad-style lab)
 *   ghostProtocol  → Terminal   (Mr. Robot-style hacker terminal)
 *   survivalCode   → Triangle   (Squid Game guard-rank shape)
 *   debugDynasty   → Rocket     (Silicon Valley "ship fast")
 *
 * Shared by ThemeSelectionPage and ThemeConfirmationPage so both screens
 * in the theme flow render the same icon for the same universe.
 */
export const THEME_ICONS = {
  codeHeist: Vault,
  breakingBug: FlaskConical,
  ghostProtocol: Terminal,
  survivalCode: Triangle,
  debugDynasty: Rocket,
};

/**
 * Appends an alpha channel to a 6-digit hex color.
 * withAlpha("#22c55e", "26") -> "#22c55e26" (~15% opacity)
 */
export function withAlpha(hex, alphaHex) {
  return `${hex}${alphaHex}`;
}