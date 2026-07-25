import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

/**
 * Fetches a problem by slug from the API (not a local file), so newly
 * seeded problems appear without a frontend redeploy. Also resolves the
 * adjacent prev/next slugs for problem-to-problem navigation.
 */
export function useProblem(slug) {
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adjacentSlugs, setAdjacentSlugs] = useState({ prev: null, next: null, nextBest: null });

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function fetchProblem() {
      try {
        setLoading(true);
        setError(null);

        const [problemResponse] = await Promise.all([
          apiFetch(`/api/problems/${slug}`),
        ]);

        setProblem(problemResponse.problem);
        setAdjacentSlugs({
          prev: problemResponse.prevSlug,
          next: problemResponse.nextSlug,
          nextBest: problemResponse.nextBestProblem ?? null,
        });
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Failed to load problem.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProblem();
    return () => { cancelled = true; };
  }, [slug]);

  return {
    problem,
    loading,
    error,
    prevSlug: adjacentSlugs.prev,
    nextSlug: adjacentSlugs.next,
    // { slug, title, difficulty, topic } | null — see
    // backend/utils/recommendNextProblem.js for how this is chosen today
    // and how it's designed to be swapped for a real recommender later.
    nextBestProblem: adjacentSlugs.nextBest,
  };
}