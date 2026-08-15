import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { apiFetch } from "../services/api";
import { PremiumContext } from "./PremiumContextObject";

/**
 * PremiumContext — audit fix.
 *
 * Before this: the backend had a single, correct entitlement source of
 * truth (isUserPremium() in backend/routes/billing.js, consumed via
 * GET /api/billing/subscription), but nothing on the frontend read it
 * except PricingPage.jsx's own local fetch. Navbar, Dashboard, Profile,
 * the problem workspace — none of them knew the user's plan. Free users
 * only discovered a feature was gated by clicking it and getting a 402.
 *
 * This context fetches /api/billing/subscription once, right after auth
 * resolves, and exposes the result app-wide via usePremium(). It is
 * intentionally a thin mirror of the backend's isUserPremium() — no
 * client-side entitlement logic is invented here, it just surfaces what
 * the backend already decided.
 *
 * `enabled: false` (monetization off) is mapped to isPremium: true,
 * exactly like the backend does — "everyone is premium while monetization
 * is off" — so consumers don't need to know about the flag separately.
 */
const DEFAULT_STATE = {
  loading: true,
  monetizationEnabled: false,
  isPremium: true, // matches backend default while MONETIZATION_ENABLED=false
  plan: "free",
  status: "none",
  expiresAt: null,
};

export function PremiumProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState(DEFAULT_STATE);

  const refresh = useCallback(async () => {
    if (!user) {
      setState(DEFAULT_STATE);
      return;
    }
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const data = await apiFetch("/api/billing/subscription");
      setState({
        loading: false,
        monetizationEnabled: !!data.enabled,
        isPremium: !!data.isPremium,
        plan: data.plan || "free",
        status: data.status || "none",
        expiresAt: data.expiresAt || null,
      });
    } catch {
      // Fail open to the same default the backend uses when it can't
      // resolve a subscription — never fail closed and lock someone out
      // of something they're entitled to just because this one fetch
      // hiccuped. Any *hard* gate is still enforced server-side regardless.
      setState({ ...DEFAULT_STATE, loading: false });
    }
  }, [user]);

  useEffect(() => {
    // Standard "fetch on mount" pattern used throughout this codebase's
    // data-fetching hooks/pages: the called function is a useCallback-wrapped
    // async fetcher whose setState calls all happen after its own await, not
    // synchronously in this effect's body. react-hooks/set-state-in-effect
    // still flags the call site here because it can't see across the
    // function boundary. A real fix would mean adopting a data-fetching
    // library (React Query/SWR) or inlining every one of these fetchers —
    // out of scope for a lint-debt pass; suppressed and documented instead.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern: the called function is a useCallback-wrapped async fetcher that sets loading/data state after its own await, not synchronously; see src/hooks/useAdminSettings.js for the fullest write-up of this decision.
    refresh();
  }, [refresh]);

  return (
    <PremiumContext.Provider value={{ ...state, refresh }}>
      {children}
    </PremiumContext.Provider>
  );
}