import { codeHeistTheme }      from "./themes/codeHeistTheme";
import { breakingBugTheme }    from "./themes/breakingBugTheme";
import { ghostProtocolTheme }  from "./themes/ghostProtocolTheme";
import { survivalCodeTheme }   from "./themes/survivalCodeTheme";
import { debugDynastyTheme }   from "./themes/debugDynastyTheme";

export const THEMES = {
  codeHeist:      codeHeistTheme,
  breakingBug:    breakingBugTheme,
  ghostProtocol:  ghostProtocolTheme,
  survivalCode:   survivalCodeTheme,
  debugDynasty:   debugDynastyTheme,
};

export const DEFAULT_THEME = "codeHeist";

export function getTheme(themeId) {
  return THEMES[themeId] ?? THEMES[DEFAULT_THEME];
}
