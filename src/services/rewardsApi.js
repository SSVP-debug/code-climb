/**
 * rewardsApi.js — Code Club "Credits" API client.
 *
 * Phase 3 (Token Economy). Thin apiFetch()-based client over the
 * already-existing backend/routes/rewards.js endpoints
 * (GET /api/rewards/balance, GET /api/rewards/ledger) — both require
 * auth and are always scoped server-side to the requesting user, never
 * a client-supplied userId (see backend/controllers/rewardController.js).
 *
 * "Credits" is the display name decided for Code Club's token economy
 * this phase — the backend model/field names (RewardLedger, amount,
 * balance) are unchanged; only user-facing copy says "Credits".
 */
import { apiFetch } from "./api";

export async function fetchMyBalance() {
  const data = await apiFetch("/api/rewards/balance");
  return data.balance;
}

export async function fetchMyLedger({ page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return apiFetch(`/api/rewards/ledger?${params.toString()}`);
}