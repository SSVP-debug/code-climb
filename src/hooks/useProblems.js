/**
 * useProblems.js
 *
 * Fetches problems from the MongoDB backend via GET /api/problems.
 * Falls back to the static problems.js file if the API is unreachable.
 */

import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";
import staticProblems from "../data/problems";
import problemMetadata from "../data/problemMetadata";

function enrichProblems(problemList) {
  return problemList.map((problem) => ({
    ...problem,
    ...(problemMetadata[problem.slug] || {}),
  }));
}

export function useProblems() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProblems() {
      try {
        setLoading(true);
        setError(null);

        const data = await apiFetch("/api/problems");

        if (cancelled) return;

        if (!data || data.length === 0) {
          // DB seeded but empty — use static fallback so page stays functional
          console.info("[useProblems] API returned 0 problems. Using static fallback.");
          setProblems(enrichProblems(staticProblems));
        } else {
          setProblems(enrichProblems(data));
        }
      } catch (err) {
        if (cancelled) return;

        console.error("[useProblems] API fetch failed:", err.message);
        // Non-breaking: show static problems so the page still works
        setProblems(enrichProblems(staticProblems));
        setError("Could not load problems from server. Showing cached problem set.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProblems();
    return () => { cancelled = true; };
  }, []);

  return { problems, loading, error };
}
