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

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    // Re-sync in case the query result changed between the initial
    // useState() call and this effect running (e.g. SSR/hydration).
    setMatches(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}