/**
 * useProblems.js
 *
 * Fetches problems from the MongoDB backend via GET /api/problems.
 * Falls back to the static problems.js file if the API is unreachable.
 *
 * staticProblems (src/data/problems.js) is ~7k lines / the full 250-problem
 * catalog. It's only ever needed on the fallback path (API down or DB
 * seeded-empty) — the common case is the API succeeding and this data
 * never being touched. It's dynamically imported below so Vite code-splits
 * it into its own chunk instead of shipping it in the main bundle on every
 * page load (audit finding, Aug 2026 — see problems-bundle-bloat note).
 */

import { useEffect, useState } from "react";
import { apiFetchOptional } from "../services/api";
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
        // Guest Mode: these two are genuinely public on the backend
        // (backend/routes/problemRoutes.js — no auth middleware at all),
        // so apiFetchOptional (not apiFetch, which throws for a guest
        // with no Firebase user) is used here — same request either way
        // for an authenticated caller, but guests reach the real API
        // instead of falling straight to the static fallback below.
        const [data, acceptanceRates] = await Promise.all([
          apiFetchOptional("/api/problems"),
          apiFetchOptional("/api/problems/stats/acceptance").catch((err) => {
            console.warn("[useProblems] Acceptance rates fetch failed:", err.message);
            return {};
          }),
        ]);

        if (cancelled) return;

        if (!data || data.length === 0) {
          // DB seeded but empty — use static fallback so page stays functional
          console.info("[useProblems] API returned 0 problems. Using static fallback.");
          const { default: staticProblems } = await import("../data/problems");
          if (cancelled) return;
          setProblems(enrichProblems(staticProblems, acceptanceRates));
        } else {
          setProblems(enrichProblems(data, acceptanceRates));
        }
      } catch (err) {
        if (cancelled) return;

        console.error("[useProblems] API fetch failed:", err.message);
        // Non-breaking: show static problems so the page still works
        const { default: staticProblems } = await import("../data/problems");
        if (cancelled) return;
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