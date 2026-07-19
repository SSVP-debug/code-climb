import { useTheme } from "../../../context/ThemeContext";
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
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-zinc-400 text-sm">
            {greeting},
          </p>

          <h1 className="text-4xl font-bold mt-2">
            {name}
          </h1>

          <p className="text-zinc-400 mt-3">
            {theme.words.welcomeTagline}
          </p>
        </div>

        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: withAlpha(theme.colors.primary, "1f"),
            color: theme.colors.primary,
          }}
        >
          <Icon size={28} strokeWidth={2} aria-hidden="true" />
        </div>
      </div>
    </SectionCard>
  );
}

export default WelcomeBanner;