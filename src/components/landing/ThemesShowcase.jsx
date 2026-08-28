import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import { getTheme } from "../../themes";
import { THEME_ICONS } from "../../themes/themeIcons";

const ARROW = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Themed Practice — Phase "07" (blueprint position), supporting-detail
// section. Rebuilt borderless per the blueprint's explicit instruction,
// replacing the previous 2-card verdict-badge simulation.
//
// Every id/name/description/color below is read from the real theme
// system (src/themes, themeIcons.js) at import time, not hand-typed —
// same sourcing principle as before, just now covering all five real
// story universes instead of a hand-picked two, since a plain list costs
// far less visual weight than the old bordered cards did. "default" (the
// no-roleplay fallback) is intentionally excluded — it isn't a story
// universe to preview.
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
        <p className="mb-4 font-mono-ui text-lp-label uppercase tracking-lp-label text-zinc-500">
          Themed practice
        </p>
        <h2 className="text-lp-h2-detail font-display font-bold tracking-tight text-white">
          Same DSA. A different way to grind.
        </h2>
        <p className="mt-4 text-zinc-400">
          Pick a universe and Code Club reframes the whole experience
          around it — same problems, same judge, a different story.
        </p>
      </div>

      <ul className="mx-auto mt-12 max-w-2xl divide-y divide-ink-800">
        {THEMES_PREVIEW.map((t) => (
          <li key={t.id} className="flex items-start gap-4 py-5">
            <t.Icon
              size={20}
              strokeWidth={2}
              style={{ color: t.color }}
              aria-hidden="true"
              className="mt-0.5 flex-shrink-0"
            />
            <div>
              <h3 className="font-display font-semibold text-white">{t.name}</h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">{t.description}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10 text-center">
        <Link
          to={user ? "/theme-selection" : "/login?role=student"}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
        >
          Explore all universes
          {ARROW}
        </Link>
      </div>
    </Reveal>
  );
}

export default ThemesShowcase;