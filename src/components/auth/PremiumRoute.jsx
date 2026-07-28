import DashboardLayout from "../../layouts/DashboardLayout";
import UpgradePrompt from "../ui/UpgradePrompt";
import { usePremium } from "../../context/PremiumContext";

/**
 * PremiumRoute — audit fix.
 *
 * Before this, premium-gated pages (e.g. Interview Mode) were reachable by
 * any authenticated user and only revealed they were paid after the page
 * mounted and its first API call came back with a 402 — a spinner, then a
 * failure, instead of an upfront answer. This mirrors RoleRoute's shape
 * (a route-level guard, not a per-component check) but for entitlement
 * instead of role.
 *
 * Note: this is a UX improvement, not a security boundary — the backend's
 * requirePremium middleware is and remains the actual enforcement. This
 * guard can only be as current as the last /api/billing/subscription
 * fetch (see PremiumContext), so it's intentionally soft — if it's ever
 * stale, the backend still blocks the request either way.
 */
export default function PremiumRoute({ children, feature }) {
  const { loading, isPremium } = usePremium();

  if (loading) return null;

  if (!isPremium) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <UpgradePrompt
            feature={feature}
            message={
              feature
                ? `${feature} is a Pro feature. Upgrade to unlock it.`
                : "This feature requires Code Club Pro."
            }
          />
        </div>
      </DashboardLayout>
    );
  }

  return children;
}