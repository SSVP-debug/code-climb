import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import { getTheme } from "../../themes";
import { THEME_ICONS } from "../../themes/themeIcons";

const ARROW = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Themed Practice — supporting-detail section.
//
// Every id/name/description/color below is read from the real theme
// system (src/themes, themeIcons.js) at import time, not hand-typed.
// "default" (the no-roleplay fallback) is intentionally excluded — it
// isn't a story universe to preview.
const THEME_IDS = ["codeHeist", "breakingBug", "ghostProtocol", "survivalCode", "debugDynasty"];

const THEMES_PREVIEW = THEME_IDS.map((id) => {
  const theme = getTheme(id);
  return {
    id,
    Icon: THEME_ICONS[id],
    name: theme.name,
    description: theme.description,
    color: theme.colors.primary,
  };
});

function ThemesShowcase({ user }) {
  return (
    <Reveal as="section" className="px-6 py-20 md:px-12 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-4 font-mono-ui text-lp-label uppercase tracking-lp-label text-[var(--muted-foreground)]">
          Themed practice
        </p>
        <h2 className="text-lp-h2-detail font-display font-bold tracking-tight text-[var(--foreground)]">
          Same DSA. A different way to grind.
        </h2>
        <p className="mt-4 text-[var(--muted-foreground)]">
          Pick a universe and Code Club reframes the whole experience
          around it — same problems, same judge, a different story.
        </p>
      </div>

      {/* Each t.color below is that story-universe's own fixed brand
          color (src/themes), not a page-theme value — intentionally left
          as-is in both Black and White Mode, same as the identical
          per-universe icon colors used on ThemeSelectionPage itself.
          Card border/background use the same color at low opacity, so
          each card reads as belonging to its universe without needing a
          new token per universe. */}
      <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {THEMES_PREVIEW.map((t) => (
          <div
            key={t.id}
            className="rounded-2xl border p-5"
            style={{ backgroundColor: `${t.color}0d`, borderColor: `${t.color}33` }}
          >
            <span
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${t.color}1a`, color: t.color }}
              aria-hidden="true"
            >
              <t.Icon size={20} strokeWidth={2} />
            </span>
            <h3 className="mt-4 font-display font-semibold text-[var(--foreground)]">{t.name}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">{t.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          to={user ? "/theme-selection" : "/login?role=student"}
          className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
        >
          Explore all universes
          {ARROW}
        </Link>
      </div>
    </Reveal>
  );
}

export default ThemesShowcase;