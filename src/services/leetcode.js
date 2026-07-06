import { apiFetch } from "./api";

/**
 * Fetches LeetCode solve stats via our own backend proxy (GET /api/leetcode/fetch),
 * not directly from the third-party alfa-leetcode-api — see backend/routes/leetcode.js
 * for why. Returns { username, easySolved, mediumSolved, hardSolved, totalSolved }.
 *
 * Throws on failure (network error, unreachable third-party API, invalid
 * username) — callers should catch and show the manual-entry fallback,
 * since the third-party dependency this proxies isn't something we
 * control the uptime of.
 */
export async function fetchLeetCodeStats(username) {
  return apiFetch(`/api/leetcode/fetch?username=${encodeURIComponent(username)}`);
}

/**
 * Saves LeetCode stats — either manually entered or fetched-then-confirmed.
 * `source` should be "manual" or "api" so the profile can (eventually, if
 * ever needed) distinguish self-reported from fetched numbers.
 */
export async function saveLeetCodeStats({ username, easySolved, mediumSolved, hardSolved, source }) {
  return apiFetch("/api/leetcode/stats", {
    method: "PUT",
    body: JSON.stringify({ username, easySolved, mediumSolved, hardSolved, source }),
  });
}