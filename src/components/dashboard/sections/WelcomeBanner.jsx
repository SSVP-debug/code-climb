import { useTheme } from "../../../hooks/useTheme";
import { auth } from "../../../firebase/firebase";
import SectionCard from "../../ui/layout/SectionCard";
import { THEME_ICONS, DEFAULT_THEME_ICON, withAlpha } from "../../../themes/themeIcons";

function WelcomeBanner() {
  const { theme } = useTheme();
  const Icon = THEME_ICONS[theme.id] ?? DEFAULT_THEME_ICON;

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good Morning"
      : hour < 18
      ? "Good Afternoon"
      : "Good Evening";

  const name =
    auth.currentUser?.displayName?.split(" ")[0] || "Coder";

  return (
    <SectionCard accented>
      <div className="flex items-center gap-3.5">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: withAlpha(theme.colors.primary, "1f"),
            color: theme.colors.primary,
          }}
        >
          <Icon size={22} strokeWidth={2} aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight truncate">
            {greeting}, {name}
          </h1>
          <p className="text-[var(--muted-foreground)] text-sm truncate">
            {theme.words.welcomeTagline}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

export default WelcomeBanner;