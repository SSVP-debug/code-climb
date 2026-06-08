import { Navigate, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { THEME_OPTIONS } from "../themes/themeOptions";

export default function ThemeConfirmationPage() {
  const navigate = useNavigate();
  const { themeId } = useTheme();

  const theme = THEME_OPTIONS.find((t) => t.id === themeId);

  if (!theme) {
    return <Navigate to="/theme-selection" replace />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <div className="text-7xl mb-6">
          {theme.icon}
        </div>

        <h1 className="text-5xl font-bold mb-6">
          {theme.name.toUpperCase()}
        </h1>

        <h2 className="text-2xl font-semibold mb-4">
          {theme.onboardingTitle}
        </h2>

        <p className="text-zinc-400 text-lg mb-10">
          {theme.onboardingMessage}
        </p>

        <button
          onClick={() => navigate("/dashboard")}
          className="px-8 py-4 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition"
        >
          Begin Journey
        </button>
      </div>
    </div>
  );
}