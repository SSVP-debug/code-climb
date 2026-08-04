import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import OnboardingContainer from "../components/onboarding/OnboardingContainer";
import { useAppContext } from "../hooks/useAppContext";
import { hasCompletedQuizToday, markQuizCompletedToday } from "../utils/dailyQuizStorage";
import { getPostLoginDestination } from "../utils/roleRedirect";

/**
 * OnboardingGate — shows the full first-session onboarding flow (Welcome ->
 * Daily Quick Quiz -> Quiz Result -> Today's Mission -> Today's Focus) once
 * per day before the Dashboard, per the first-session-experience spec.
 * Scoped to /dashboard only (unlike ThemeGate, which wraps every protected
 * route) — the spec's flow diagram ends at Dashboard, and gating every
 * route would force the flow in front of pages it has nothing to do with.
 *
 * Renders the flow inline (like PremiumRoute renders UpgradePrompt inline)
 * rather than redirecting to a separate route — there's nothing to deep-link
 * to and no reason to leave /dashboard's URL.
 *
 * OnboardingContainer owns all step-to-step state internally and only calls
 * back here once, when the whole flow (including the quiz result screen,
 * shown once by DailyQuickQuiz mid-flow) is complete — so this gate only
 * needs to know whether today's flow is done, not what happened during it.
 *
 * Role redirect: LoginPage.jsx no longer waits on /api/init before
 * navigating on the plain student login path (see its redirectAfterAuth),
 * so a returning recruiter/TPO can land here before AppContext's role has
 * hydrated. Rather than guess, this gate reads the eventually-consistent
 * `role` at the END of the onboarding flow (once all five screens —
 * which take meaningfully longer than a network round trip — are done)
 * and bounces them to their real dashboard then, instead of showing them
 * a student-framed flow all the way through. Known edge case: if
 * hydration is still unresolved even at that point (very slow backend),
 * the person completes the flow as a "student" and only gets bounced on
 * their next /dashboard visit — this is a soft UX gate, not a security
 * boundary, so that's an acceptable fallback rather than something worth
 * adding a loading flag to AppContext for right now.
 */
export default function OnboardingGate({ children }) {
  const [completedToday, setCompletedToday] = useState(() => hasCompletedQuizToday());
  const { role } = useAppContext();
  const navigate = useNavigate();

  function handleOnboardingComplete() {
    markQuizCompletedToday();

    const destination = getPostLoginDestination(role, null);
    if (destination !== "/dashboard") {
      navigate(destination, { replace: true });
      return;
    }

    setCompletedToday(true);
  }

  if (completedToday) {
    return children;
  }

  return (
    <DashboardLayout>
      <OnboardingContainer onComplete={handleOnboardingComplete} />
    </DashboardLayout>
  );
}