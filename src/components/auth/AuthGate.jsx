import { LogIn } from "lucide-react";
import { useLocation } from "react-router-dom";
import Button from "../ui/Button";
import { useIdentity } from "../../hooks/useIdentity";
import { buildLoginRedirect } from "../../utils/authRedirect";
import { AUTH_GATE_MESSAGES } from "../../utils/authGateMessages";

/**
 * AuthGate — reusable "sign in required" gate, modeled directly on the
 * existing PremiumRoute/UpgradePrompt pattern (components/auth/PremiumRoute.jsx
 * + components/ui/UpgradePrompt.jsx): a single component that either
 * renders its children (identity check passed) or an inline card
 * explaining why, with a Sign In button that preserves where the person
 * was — instead of every guest-gated feature inventing its own redirect/
 * message/card.
 *
 * Same "soft guard" caveat as PremiumRoute: this is a UX layer, not the
 * security boundary. The actual enforcement is always server-side
 * (backend/routes/judge.js's requireAuth on /submit, requireAuth +
 * requireRole + requireVerified on every recruiter/tpo candidate-data
 * route) — this only ever decides what to render, never what data to
 * fetch, and every call site gating a real network call must check
 * identity before firing that request too (see RecruiterDashboardPage.jsx
 * / TpoDashboardPage.jsx's own comments on this).
 *
 * Usage — block a whole section (recruiter/TPO guest shells):
 *   <AuthGate reason="candidates">
 *     <CandidateSearchResults />
 *   </AuthGate>
 *
 * Usage — a specific message not covered by a preset:
 *   <AuthGate message="Sign in to export this report.">...</AuthGate>
 *
 * Usage — inline (no full-height centering wrapper; caller controls
 * layout, e.g. a card embedded inside an existing panel):
 *   <AuthGate reason="submit" inline>...</AuthGate>
 *
 * For a *click-triggered* gate (e.g. "Submit" stays a real, clickable
 * button for guests — clicking it is what reveals the message, rather
 * than the button being replaced outright) render <AuthGateCard> directly
 * instead of wrapping content in <AuthGate> — see WorkspacePanel.jsx's
 * Submit handling for that usage.
 *
 * AUTH_GATE_MESSAGES itself lives in utils/authGateMessages.js, not here —
 * see that file's comment.
 */

/**
 * AuthGateCard — the presentational card alone, with no identity check.
 * Exported separately so call sites that need to trigger it conditionally
 * (e.g. only after a guest clicks a specific action, not on every render)
 * can render it without re-deriving the gate logic themselves.
 */
export function AuthGateCard({ message, reason = "default", next }) {
  const location = useLocation();
  const resolvedMessage = message || AUTH_GATE_MESSAGES[reason] || AUTH_GATE_MESSAGES.default;
  const loginHref = buildLoginRedirect(next ?? (location.pathname + location.search));

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center max-w-md mx-auto">
      <div className="w-12 h-12 rounded-2xl bg-[var(--theme-primary,#2dd4bf)]/10 text-[var(--theme-primary,#2dd4bf)] flex items-center justify-center mx-auto mb-4">
        <LogIn size={22} strokeWidth={2} aria-hidden="true" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Sign in required</h2>
      <p className="text-zinc-400 text-sm mb-6">{resolvedMessage}</p>
      <Button to={loginHref} variant="primary" className="w-full">
        Sign In
      </Button>
    </div>
  );
}

export default function AuthGate({ children, message, reason = "default", next, inline = false }) {
  const { isAuthenticated } = useIdentity();

  if (isAuthenticated) return children;

  const card = <AuthGateCard message={message} reason={reason} next={next} />;

  if (inline) return card;

  return <div className="flex items-center justify-center py-16 px-4">{card}</div>;
}
