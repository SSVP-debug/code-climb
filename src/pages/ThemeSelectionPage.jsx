import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { THEME_OPTIONS } from "../themes/themeOptions";

export default function ThemeSelectionPage() {
    const navigate = useNavigate();
    const { setTheme, themeId: currentThemeId } = useTheme();

    const handleSelect = (themeId) => {
        if (themeId === currentThemeId) {
            navigate("/profile");
            return;
        }

        setTheme(themeId);
        navigate("/theme-confirmation");
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center px-6 py-12">
            <div className="max-w-4xl w-full text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">
                    Choose Your Code Club Universe
                </h1>

                <p className="text-zinc-400">
                    Your coding journey should feel like an adventure.
                    Select the world where you'll begin.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 w-full max-w-5xl">
                {THEME_OPTIONS.map((theme) => (
                    <div
                        key={theme.id}
                        className="
        bg-zinc-900 border border-zinc-800 rounded-2xl p-6
        transition-all duration-300
        hover:-translate-y-2
        hover:scale-[1.02]
        hover:border-green-500
        hover:shadow-lg hover:shadow-green-500/10
    "
                    >
                        <div className="text-4xl mb-4">{theme.icon}</div>

                        <h2 className="text-2xl font-bold mb-3">
                            {theme.name}
                        </h2>
                        {currentThemeId === theme.id && (
                            <p className="text-green-400 text-sm font-medium mb-2">
                                Current Universe
                            </p>
                        )}

                        <p className="text-zinc-400 mb-6">
                            {theme.description}
                        </p>

                        <div className="space-y-2 mb-6 text-sm">
                            <p>
                                <span className="text-zinc-500">Accepted → </span>
                                {theme.acceptedPreview}
                            </p>

                            <p>
                                <span className="text-zinc-500">Runtime Error → </span>
                                {theme.runtimePreview}
                            </p>
                        </div>

                        <button
                            onClick={() => handleSelect(theme.id)}
                            className="w-full py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition"
                        >
                            Enter Universe
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}