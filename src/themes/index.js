import { codeHeistTheme } from "./themes/codeHeistTheme";
import { breakingBugTheme } from "./themes/breakingBugTheme";

export const THEMES = {
  codeHeist: codeHeistTheme,
  breakingBug: breakingBugTheme,
};

export const DEFAULT_THEME = "codeHeist";

export function getTheme(themeId) {
  return THEMES[themeId] ?? THEMES[DEFAULT_THEME];
}