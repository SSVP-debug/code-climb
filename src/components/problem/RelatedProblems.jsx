import { Link } from "react-router-dom";
import problems from "../../data/problems.js";

const DIFFICULTY_STYLES = {
  Easy:   "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  Medium: "text-amber-400 border-amber-500/20 bg-amber-500/10",
  Hard:   "text-rose-400 border-rose-500/20 bg-rose-500/10",
};

/**
 * RelatedProblems
 *
 * Renders a list of thematically related problems as navigation links.
 * Each slug is resolved to a full problem object from the catalog.
 * Invalid/missing slugs are silently skipped.
 */
function RelatedProblems({ relatedSlugs, currentSlug }) {
  if (!relatedSlugs || relatedSlugs.length === 0) return null;

  const resolved = relatedSlugs
    .filter((slug) => slug !== currentSlug)
    .map((slug) => problems.find((p) => p.slug === slug))
    .filter(Boolean);

  if (resolved.length === 0) return null;

  return (
    <section>
      <h3 className="text-lg font-semibold text-white mb-3">Related Problems</h3>
      <div className="space-y-2">
        {resolved.map((p) => (
          <Link
            key={p.slug}
            to={`/problems/${p.slug}`}
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/60 hover:border-zinc-700 transition px-4 py-3 group"
          >
            <span className="text-sm text-zinc-300 group-hover:text-white transition font-medium truncate pr-3">
              {p.title}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                  DIFFICULTY_STYLES[p.difficulty] ?? "text-zinc-400 border-zinc-700 bg-zinc-800"
                }`}
              >
                {p.difficulty}
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="text-zinc-600 group-hover:text-zinc-400 transition"
              >
                <path
                  d="M5 3L9 7L5 11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default RelatedProblems;
