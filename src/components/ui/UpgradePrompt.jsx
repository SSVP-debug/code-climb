import { Sparkles } from "lucide-react";
import Button from "./Button";

/**
 * UpgradePrompt — audit fix.
 *
 * Every premium-gated backend route returns a 402 with `{ error, upgradeUrl,
 * currentPlan }` (see backend/middleware/premiumGate.js), but until now
 * every frontend caller only ever saw the plain `.message` string —
 * `apiFetch` discarded the rest. Now that apiFetch attaches `.status` and
 * `.body` to thrown errors, gated pages can render this instead of a
 * dead-end error card with nowhere to go.
 *
 * Usage:
 *   catch (err) {
 *     if (err.status === 402) setUpgrade(err.body);
 *     else setError(err.message);
 *   }
 *   ...
 *   {upgrade && <UpgradePrompt message={upgrade.error} upgradeUrl={upgrade.upgradeUrl} />}
 */
export default function UpgradePrompt({
  message = "This feature requires Code Club Pro.",
  upgradeUrl = "/pricing",
  feature,
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center max-w-md mx-auto">
      <div className="w-12 h-12 rounded-2xl bg-[var(--theme-primary,#2dd4bf)]/10 text-[var(--theme-primary,#2dd4bf)] flex items-center justify-center mx-auto mb-4">
        <Sparkles size={22} strokeWidth={2} aria-hidden="true" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">
        {feature ? `${feature} is a Pro feature` : "Pro feature"}
      </h2>
      <p className="text-zinc-400 text-sm mb-6">{message}</p>
      <Button to={upgradeUrl} variant="primary" className="w-full">
        Upgrade to Pro
      </Button>
    </div>
  );
}