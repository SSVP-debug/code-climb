import { Link } from "react-router-dom";
import { CheckCircle2, AlertTriangle, Bomb } from "lucide-react";
import Reveal from "./Reveal";
import { getTheme } from "../../themes";
import { THEME_ICONS, withAlpha } from "../../themes/themeIcons";

const ARROW = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Colors and icons come straight from the real theme system (src/themes),
// not hand-picked here, so this preview can't drift out of sync with what
// students actually see after picking a universe.
const THEMES_PREVIEW = ["codeHeist", "breakingBug"].map((id) => {
  const colors = getTheme(id).colors;
  return {
    id,
    Icon: THEME_ICONS[id],
    colors,
    name: id === "codeHeist" ? "Code Heist" : "Breaking Bug",
    accepted: id === "codeHeist" ? "Vault Breached" : "Crystal Clear",
    error: id === "codeHeist" ? "Escape Failed" : "Lab Explosion",
    ErrorIcon: id === "codeHeist" ? AlertTriangle : Bomb,
    texture:
      id === "codeHeist"
        ? {
            backgroundImage: `repeating-linear-gradient(45deg, ${withAlpha(colors.primary, "0f")} 0px, ${withAlpha(colors.primary, "0f")} 2px, transparent 2px, transparent 14px)`,
          }
        : {
            backgroundImage: `repeating-linear-gradient(0deg, ${withAlpha(colors.primary, "12")} 0px, ${withAlpha(colors.primary, "12")} 1px, transparent 1px, transparent 24px), repeating-linear-gradient(90deg, ${withAlpha(colors.primary, "12")} 0px, ${withAlpha(colors.primary, "12")} 1px, transparent 1px, transparent 24px)`,
          },
  };
});

function ThemesShowcase({ user }) {
  return (
    <section className="max-w-6xl mx-auto px-6 md:px-12 py-20">
      <Reveal className="text-center mb-12">
        <p className="text-xs text-verdict-accept font-mono-ui uppercase tracking-widest font-semibold mb-3">
          What makes us different
        </p>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          Pick your universe. Own your grind.
        </h2>
        <p className="text-zinc-400 max-w-xl mx-auto">
          Not just problems, Code Club has <em>worlds</em>. Same DSA,
          a completely different experience.
        </p>
      </Reveal>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {THEMES_PREVIEW.map((t) => (
          <Reveal
            key={t.id}
            className="relative bg-ink-800 border rounded-2xl p-7 overflow-hidden"
            style={{ borderColor: withAlpha(t.colors.primary, "40") }}
          >
            <div style={t.texture} className="absolute inset-0 pointer-events-none" />
            <div
              aria-hidden="true"
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                background: `linear-gradient(90deg, ${t.colors.primary}, ${t.colors.accent})`,
              }}
            />
            <div className="relative">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{
                  backgroundColor: withAlpha(t.colors.primary, "1f"),
                  color: t.colors.primary,
                }}
              >
                <t.Icon size={26} strokeWidth={2} aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold mb-1">{t.name}</h3>
              <div className="space-y-2 mt-4 text-sm font-mono-ui">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 w-20 flex-shrink-0 text-xs">Accepted</span>
                  <span
                    className="border px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    style={{
                      color: t.colors.primary,
                      borderColor: withAlpha(t.colors.primary, "40"),
                      backgroundColor: withAlpha(t.colors.primary, "1a"),
                    }}
                  >
                    <CheckCircle2 size={13} strokeWidth={2.25} aria-hidden="true" />
                    {t.accepted}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 w-20 flex-shrink-0 text-xs">Error</span>
                  <span className="border border-verdict-reject/25 bg-verdict-reject/10 text-verdict-reject px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                    <t.ErrorIcon size={13} strokeWidth={2.25} aria-hidden="true" />
                    {t.error}
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="text-center">
        <Link
          to={user ? "/theme-selection" : "/login?role=student"}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
        >
          More universes coming soon
          {ARROW}
        </Link>
      </Reveal>
    </section>
  );
}

export default ThemesShowcase;