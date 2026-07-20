/**
 * useLiveStats.js
 *
 * Fetches real platform stats (problem count, language count, theme count)
 * for the landing page's stats bar, falling back to friendly static labels
 * if the request fails — a marketing page should never show a spinner or
 * error state, just degrade gracefully.
 *
 * Extracted from src/pages/LandingPage.jsx (Staff review §4/§9/#12).
 */
import { useEffect, useState } from "react";

const STATIC_STATS = [
  { key: "problems", value: "Growing", label: "Problem Library" },
  { key: "languages", value: "Multiple", label: "Languages" },
  { key: "themes", value: "Themed", label: "Universes" },
  { key: "ai", value: "AI", label: "Coaching Built In" },
];

export function useLiveStats() {
  const [stats, setStats] = useState(STATIC_STATS);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    fetch(`${API_URL}/api/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setStats([
          {
            key: "problems",
            value: data.problems > 0 ? `${data.problems}+` : "—",
            label: "DSA Problems",
          },
          {
            key: "languages",
            value: data.languages > 0 ? String(data.languages) : "—",
            label: "Languages",
          },
          {
            key: "themes",
            value: data.themes > 0 ? String(data.themes) : "—",
            label: "Themed Universes",
          },
        ]);
      })
      .catch(() => {}); // fail silently — static fallback stays
  }, []);

  return stats;
}
