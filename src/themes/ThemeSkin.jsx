import { useTheme } from "../context/ThemeContext";
export default function ThemeSkin({ children }) {
  const { theme } = useTheme();
  const { primary, secondary, border, accent } = theme.colors;

  return (
    <div
      style={{
        display: "contents",
        "--theme-primary": primary,
        "--theme-secondary": secondary,
        "--theme-border": border,
        "--theme-accent": accent,
      }}
    >
      {children}
    </div>
  );
}