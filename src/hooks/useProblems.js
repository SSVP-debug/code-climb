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

function enrichProblems(problemList, acceptanceRates = {}) {
  return problemList.map((problem) => ({
    ...problem,
    ...(problemMetadata[problem.slug] || {}),
    // Only attach when we actually have data — missing entry means "not
    // enough submissions yet", which ProblemCard treats differently from 0%.
    acceptanceRate: acceptanceRates[problem.slug]?.rate ?? null,
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

        // Acceptance rates are a nice-to-have display detail, not core data —
        // fetched in parallel but never allowed to block or fail the problem
        // list itself. If this fetch fails, cards just show no acceptance %.
        const [data, acceptanceRates] = await Promise.all([
          apiFetch("/api/problems"),
          apiFetch("/api/problems/stats/acceptance").catch((err) => {
            console.warn("[useProblems] Acceptance rates fetch failed:", err.message);
            return {};
          }),
        ]);

        if (cancelled) return;

        if (!data || data.length === 0) {
          // DB seeded but empty — use static fallback so page stays functional
          console.info("[useProblems] API returned 0 problems. Using static fallback.");
          setProblems(enrichProblems(staticProblems, acceptanceRates));
        } else {
          setProblems(enrichProblems(data, acceptanceRates));
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