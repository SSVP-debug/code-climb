/**
 * featureRequestApi.js — Code Club Feature Requests (Phase 5) API client.
 *
 * Both student-facing and admin-facing functions live in one file, same
 * precedent contributionApi.js and rewardStoreApi.js already established
 * (as opposed to opportunityApi.js's narrower split) — every backend route
 * here (backend/routes/featureRequests.js, backend/routes/admin.js's
 * Feature Requests section) requires a signed-in user, no logged-out half
 * to this feature at all, so apiFetch() (Firebase-token-authenticated,
 * throws on non-2xx) is the only client used throughout.
 */
import { apiFetch } from "./api";

// ── Student-facing ───────────────────────────────────────────────────────

export async function submitFeatureRequest({ title, description }) {
  const data = await apiFetch("/api/feature-requests", {
    method: "POST",
    body: JSON.stringify({ title, description }),
  });
  return data.featureRequest;
}

export async function fetchFeatureRequests({ status, sort = "votes", page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ sort, page: String(page), limit: String(limit) });
  if (status) params.set("status", status);
  return apiFetch(`/api/feature-requests?${params.toString()}`);
}

export async function fetchMyFeatureRequests({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiFetch(`/api/feature-requests/mine?${params.toString()}`);
}

// Toggle — { voted: true } means the caller now has a vote on this
// request, { voted: false } means they just removed theirs.
export async function voteFeatureRequest(id) {
  return apiFetch(`/api/feature-requests/${id}/vote`, { method: "POST" });
}

export async function editFeatureRequest(id, { title, description }) {
  const body = {};
  if (title !== undefined) body.title = title;
  if (description !== undefined) body.description = description;
  return apiFetch(`/api/feature-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function withdrawFeatureRequest(id) {
  return apiFetch(`/api/feature-requests/${id}/withdraw`, { method: "POST" });
}

// ── Admin-facing ─────────────────────────────────────────────────────────

export async function fetchFeatureRequestsAdmin({ status, sort = "votes", page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ sort, page: String(page), limit: String(limit) });
  if (status) params.set("status", status);
  return apiFetch(`/api/admin/feature-requests?${params.toString()}`);
}

export async function updateFeatureRequestStatusAdmin(id, status) {
  return apiFetch(`/api/admin/feature-requests/${id}/status`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

export async function retryFeatureRequestRewardsAdmin() {
  return apiFetch("/api/admin/feature-requests/retry-rewards", {
    method: "POST",
    body: JSON.stringify({}),
  });
}