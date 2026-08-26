/**
 * useLanguages.js
 *
 * Content & Execution Architecture, Phase 2. Fetches the currently
 * enabled languages from GET /api/languages instead of the frontend
 * hardcoding a language list — mirrors useProblems.js's own
 * fetch-with-static-fallback shape exactly, for the same reason: if the
 * API is briefly unreachable, the editor should still render something
 * usable rather than an empty language selector.
 */
import { useEffect, useState } from "react";
import { apiFetchOptional } from "../services/api";

// Fallback only — used solely when GET /api/languages can't be reached at
// all. Not a second source of truth: backend/config/languages.js is the
// only place that actually decides what's enabled. If this list and the
// backend's ever disagree, the backend wins the moment the request
// succeeds.
const FALLBACK_LANGUAGES = [
  { id: "python", name: "Python", extension: "py" },
  { id: "javascript", name: "JavaScript", extension: "js" },
  { id: "java", name: "Java", extension: "java" },
  { id: "cpp", name: "C++", extension: "cpp" },
];

export function useLanguages() {
  const [languages, setLanguages] = useState(FALLBACK_LANGUAGES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchLanguages() {
      try {
        // Guest Mode integration: GET /api/languages is genuinely public
        // (no auth middleware at all — see backend/routes/languages.js),
        // so apiFetchOptional (not apiFetch, which throws immediately for
        // a caller with no Firebase user) is used here — same request
        // either way for an authenticated caller, but guests now reach
        // the real enabled-language list instead of silently falling back
        // to FALLBACK_LANGUAGES on every load.
        const data = await apiFetchOptional("/api/languages");
        if (cancelled) return;

        if (Array.isArray(data?.languages) && data.languages.length > 0) {
          setLanguages(data.languages);
        }
        // An empty/malformed response deliberately keeps the fallback
        // rather than rendering a selector with zero options.
      } catch (err) {
        console.warn("[useLanguages] Falling back to static language list:", err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLanguages();
    return () => {
      cancelled = true;
    };
  }, []);

  return { languages, loading };
}
