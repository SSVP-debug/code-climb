import { codeHeistTheme }      from "./themes/codeHeistTheme";
import { breakingBugTheme }    from "./themes/breakingBugTheme";
import { ghostProtocolTheme }  from "./themes/ghostProtocolTheme";
import { survivalCodeTheme }   from "./themes/survivalCodeTheme";
import { debugDynastyTheme }   from "./themes/debugDynastyTheme";
import { defaultTheme }        from "./themes/defaultTheme";

export const THEMES = {
  default:        defaultTheme,
  codeHeist:      codeHeistTheme,
  breakingBug:    breakingBugTheme,
  ghostProtocol:  ghostProtocolTheme,
  survivalCode:   survivalCodeTheme,
  debugDynasty:   debugDynastyTheme,
};

// The neutral, unthemed fallback — distinct from every story universe.
export const DEFAULT_THEME = "default";

export function getTheme(themeId) {
  return THEMES[themeId] ?? THEMES[DEFAULT_THEME];
}