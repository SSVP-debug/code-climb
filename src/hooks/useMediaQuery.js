import { useState, useEffect } from "react";

/**
 * Tracks whether a CSS media query currently matches, e.g.
 *   const isDesktop = useMediaQuery("(min-width: 1024px)");
 *
 * Why this exists: ProblemWorkspaceLayout needs to know desktop vs. mobile
 * in JS (not just CSS) so it can swap layout *chrome* around a single,
 * permanently-mounted <ProblemEditor>/<WorkspacePanel> pair — see that
 * file's header comment for why a remount there is unacceptable.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );
  // Tracks which `query` the current `matches` value was computed for, so
  // we can re-derive it during render when `query` itself changes —
  // useState's initializer only runs once on mount, so without this,
  // `matches` would stay stale (computed for the OLD query) until the
  // next actual matchMedia "change" event fires, which may never happen
  // if the new query's value doesn't happen to flip.
  const [trackedQuery, setTrackedQuery] = useState(query);

  if (query !== trackedQuery) {
    setTrackedQuery(query);
    setMatches(typeof window !== "undefined" && window.matchMedia(query).matches);
  }

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}