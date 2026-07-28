import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./authContext";
import { apiFetch } from "../services/api";

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
const PremiumContext = createContext(null);

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
    refresh();
  }, [refresh]);

  return (
    <PremiumContext.Provider value={{ ...state, refresh }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) {
    throw new Error("usePremium() must be used within a PremiumProvider");
  }
  return ctx;
}