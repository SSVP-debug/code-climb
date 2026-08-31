/**
 * rewardStoreApi.js — Code Club Rewards Store (Phase 4) API client.
 *
 * Same shape as contributionApi.js — every backend route
 * (backend/routes/rewardStore.js, backend/routes/admin.js's Rewards
 * Store section) requires a signed-in user, student or admin, so every
 * call here goes through apiFetch() (Firebase-token-authenticated,
 * throws on non-2xx).
 */
import { apiFetch } from "./api";

// ── Student-facing ───────────────────────────────────────────────────────

export async function fetchStoreItems({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiFetch(`/api/reward-store/items?${params.toString()}`);
}

export async function requestRedemption(itemId, shippingAddress = null) {
  const data = await apiFetch("/api/reward-store/redemptions", {
    method: "POST",
    body: JSON.stringify({ itemId, ...(shippingAddress ? { shippingAddress } : {}) }),
  });
  return data.redemption;
}

export async function fetchMyRedemptions({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiFetch(`/api/reward-store/redemptions/mine?${params.toString()}`);
}

export async function cancelRedemption(id) {
  return apiFetch(`/api/reward-store/redemptions/${id}/cancel`, { method: "POST" });
}

// ── Admin-facing ─────────────────────────────────────────────────────────

export async function fetchCatalogItemsAdmin({ status = "all", page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ status, page: String(page), limit: String(limit) });
  return apiFetch(`/api/admin/reward-store/items?${params.toString()}`);
}

export async function createCatalogItemAdmin(item) {
  const data = await apiFetch("/api/admin/reward-store/items", {
    method: "POST",
    body: JSON.stringify(item),
  });
  return data.item;
}

export async function updateCatalogItemAdmin(id, patch) {
  const data = await apiFetch(`/api/admin/reward-store/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return data.item;
}

export async function fetchRedemptionsAdmin({ status = "pending", page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ status, page: String(page), limit: String(limit) });
  return apiFetch(`/api/admin/reward-store/redemptions?${params.toString()}`);
}

export async function fulfillRedemptionAdmin(id, adminNotes = null) {
  return apiFetch(`/api/admin/reward-store/redemptions/${id}/fulfill`, {
    method: "POST",
    body: JSON.stringify({ adminNotes }),
  });
}

export async function rejectRedemptionAdmin(id, reason = null) {
  return apiFetch(`/api/admin/reward-store/redemptions/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}