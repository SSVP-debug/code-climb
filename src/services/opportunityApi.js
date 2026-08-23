/**
 * opportunityApi.js — Code Club Opportunity Radar API client.
 *
 * Two distinct groups, matching the backend's auth split
 * (backend/routes/opportunities.js is public; backend/routes/admin.js's
 * opportunity routes require requireAdmin):
 *
 *   Public functions — plain `fetch`, same pattern as fetchAnnouncement()
 *   in services/api.js. Must work for a fully logged-out visitor (PART 6:
 *   the public opportunity page requires no login).
 *
 *   Admin functions — use apiFetch() (Firebase-token-authenticated,
 *   throws on non-2xx), same as every other admin page in this codebase.
 */
import { apiFetch } from "./api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ── Public ────────────────────────────────────────────────────────────────

export async function fetchOpportunities(filters = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.category) params.set("category", filters.category);
  if (filters.location) params.set("location", filters.location);
  if (filters.closingSoon) params.set("closingSoon", "true");

  const qs = params.toString();
  const res = await fetch(`${API_URL}/api/opportunities${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to load opportunities.");
  return res.json();
}

export async function fetchOpportunity(ccId) {
  const res = await fetch(`${API_URL}/api/opportunities/${encodeURIComponent(ccId)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load opportunity.");
  const data = await res.json();
  return data.opportunity;
}

// Fire-and-forget — a failed view/click ping must never block or error out
// the page for the visitor. Mirrors warmBackend()'s swallow-errors style.
export function trackOpportunityView(ccId) {
  fetch(`${API_URL}/api/opportunities/${encodeURIComponent(ccId)}/view`, {
    method: "POST",
  }).catch(() => {});
}

export function trackOpportunityApplyClick(ccId, source = "direct") {
  fetch(`${API_URL}/api/opportunities/${encodeURIComponent(ccId)}/apply-click`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source }),
  }).catch(() => {});
}

// ── Admin ────────────────────────────────────────────────────────────────

export async function fetchOpportunitiesAdmin(filters = {}) {
  const params = new URLSearchParams(filters);
  const qs = params.toString();
  return apiFetch(`/api/admin/opportunities${qs ? `?${qs}` : ""}`);
}

export async function fetchOpportunityAdmin(id) {
  return apiFetch(`/api/admin/opportunities/${id}`);
}

export async function createOpportunityAdmin(payload) {
  return apiFetch("/api/admin/opportunities", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateOpportunityAdmin(id, payload) {
  return apiFetch(`/api/admin/opportunities/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

function transition(id, action, body) {
  return apiFetch(`/api/admin/opportunities/${id}/${action}`, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export const submitOpportunityForReview = (id) => transition(id, "submit-review");
export const approveOpportunityAdmin = (id) => transition(id, "approve");
export const publishOpportunityAdmin = (id) => transition(id, "publish");
export const rejectOpportunityAdmin = (id, reason) => transition(id, "reject", { reason });
export const archiveOpportunityAdmin = (id) => transition(id, "archive");
export const markOpportunityExpiredAdmin = (id) => transition(id, "mark-expired");
export const duplicateOpportunityAdmin = (id) => transition(id, "duplicate");

export async function fetchOpportunityAnalyticsAdmin(id) {
  return apiFetch(`/api/admin/opportunities/${id}/analytics`);
}

// ── Import (AI-assisted extraction) ─────────────────────────────────────

export async function extractOpportunitiesAdmin(researchText) {
  return apiFetch("/api/admin/opportunities/import/extract", {
    method: "POST",
    body: JSON.stringify({ researchText }),
  });
}

export async function importSelectedOpportunitiesAdmin(opportunities) {
  return apiFetch("/api/admin/opportunities/import/bulk", {
    method: "POST",
    body: JSON.stringify({ opportunities }),
  });
}
