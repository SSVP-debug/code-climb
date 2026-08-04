import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import OnboardingContainer from "../components/onboarding/OnboardingContainer";
import { useAppContext } from "../hooks/useAppContext";
import {
  hasShownOnboardingThisSession,
  markOnboardingShownThisSession,
} from "../utils/dailyQuizStorage";
import { getPostLoginDestination } from "../utils/roleRedirect";

/**
 * OnboardingGate — shows the first-session onboarding flow (Welcome ->
 * [Daily Quick Quiz -> Quiz Result] -> Today's Mission -> Today's Focus ->
 * Workspace Preparation) once per SESSION before the Dashboard, per the
 * "refine first-session experience" plan. This replaced the original
 * once-per-DAY gate: the onboarding is no longer a Render cold-start
 * workaround, it's a permanent product feature, so it now reappears every
 * login rather than once per calendar day. The Quiz step specifically
 * stays day-gated internally by OnboardingContainer — see its own comment.
 * Scoped to /dashboard only (unlike ThemeGate, which wraps every protected
 * route) — the flow ends at Dashboard, and gating every route would force
 * it in front of pages it has nothing to do with.
 *
 * Renders the flow inline (like PremiumRoute renders UpgradePrompt inline)
 * rather than redirecting to a separate route — there's nothing to deep-link
 * to and no reason to leave /dashboard's URL.
 *
 * OnboardingContainer owns all step-to-step state internally and only calls
 * back here once, when the whole flow — including its own readiness gate
 * (WorkspacePreparationScreen, the final step) — is complete. That means by
 * the time handleOnboardingComplete fires, AppContext's isBackendReady is
 * guaranteed true, which also resolves what used to be a known edge case
 * here: role redirect below now always sees a hydrated `role` rather than
 * racing hydration, since the flow itself no longer ends until hydration
 * has settled.
 */
export default function OnboardingGate({ children }) {
  const [shownThisSession, setShownThisSession] = useState(() =>
    hasShownOnboardingThisSession()
  );
  const { role } = useAppContext();
  const navigate = useNavigate();

  function handleOnboardingComplete() {
    markOnboardingShownThisSession();

    const destination = getPostLoginDestination(role, null);
    if (destination !== "/dashboard") {
      navigate(destination, { replace: true });
      return;
    }

    setShownThisSession(true);
  }

  if (shownThisSession) {
    return children;
  }

  return (
    <DashboardLayout>
      <OnboardingContainer onComplete={handleOnboardingComplete} />
    </DashboardLayout>
  );
}