/**
 * contributionApi.js — Code Club Contribution Infrastructure API client.
 *
 * Both groups use apiFetch() (Firebase-token-authenticated, throws on
 * non-2xx) — unlike opportunityApi.js, there is no public/logged-out half
 * of this feature: every backend route (backend/routes/contributions.js,
 * backend/routes/admin.js's Contribution section) requires a signed-in
 * user, student or admin.
 */
import { apiFetch } from "./api";

// ── Student-facing ───────────────────────────────────────────────────────

export async function submitContribution(kind, payload) {
  const data = await apiFetch("/api/contributions", {
    method: "POST",
    body: JSON.stringify({ kind, payload }),
  });
  return data.contribution;
}

export async function fetchMyContributions({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiFetch(`/api/contributions/mine?${params.toString()}`);
}

// ── Admin-facing ─────────────────────────────────────────────────────────

export async function fetchContributionsAdmin({ status = "pending", page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ status, page: String(page), limit: String(limit) });
  return apiFetch(`/api/admin/contributions?${params.toString()}`);
}

export async function approveContributionAdmin(id) {
  return apiFetch(`/api/admin/contributions/${id}/approve`, { method: "POST" });
}

export async function rejectContributionAdmin(id, reason) {
  return apiFetch(`/api/admin/contributions/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function retryContributionRewardsAdmin() {
  return apiFetch("/api/admin/contributions/retry-rewards", {
    method: "POST",
    body: JSON.stringify({}),
  });
}