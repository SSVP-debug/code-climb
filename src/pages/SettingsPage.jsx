import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext";

function SettingsPage() {
    const { theme } = useTheme();

    return (
        <div className="max-w-4xl mx-auto px-6 py-10 text-white">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <div className="space-y-6">

                <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold mb-2">Appearance</h2>

                    <p className="text-zinc-400">
                        Current Universe
                    </p>

                    <p className="font-semibold mt-2">
                        {theme.name}
                    </p>
                </section>

                <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold mb-2">
                        Editor
                    </h2>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={false}
                            readOnly
                        />
                        <span>Start with blank editor without starter code</span>
                    </label>
                    <p className="mt-2 text-sm text-zinc-500">
                        Preference will be available after backend support.
                    </p>
                </section>

                <section className="bg-red-950/30 border border-red-800 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold text-red-400 mb-2">
                        Danger Zone
                    </h2>

                    <button
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 transition"
                        onClick={() => toast("Progress reset will be implemented in a future update.")}
                    >
                        Reset Progress
                    </button>

                    <p className="mt-3 text-sm text-zinc-500">
                        This action will permanently delete your progress, streaks, XP, and submissions.
                    </p>
                </section>

            </div>
        </div>
    );
}

export default SettingsPage;