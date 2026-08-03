import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import DailyQuickQuiz from "../components/onboarding/DailyQuickQuiz";
import { useAppContext } from "../hooks/useAppContext";
import { hasCompletedQuizToday, markQuizCompletedToday } from "../utils/dailyQuizStorage";
import { getPostLoginDestination } from "../utils/roleRedirect";

/**
 * OnboardingGate — shows the Daily Quick Quiz once per day before the
 * Dashboard, per the first-session-experience spec. Scoped to /dashboard
 * only (unlike ThemeGate, which wraps every protected route) — the spec's
 * flow diagram ends at Dashboard, and gating every route would force the
 * quiz in front of pages the quiz has nothing to do with.
 *
 * Renders the quiz inline (like PremiumRoute renders UpgradePrompt inline)
 * rather than redirecting to a separate route — there's nothing to deep-link
 * to and no reason to leave /dashboard's URL.
 *
 * The quiz result (score + per-question review) is shown once, by
 * DailyQuickQuiz itself, right when the quiz finishes — it does not
 * reappear on the dashboard afterward, so this gate only needs to know
 * whether today's quiz is done, not what the result was.
 *
 * Role redirect: LoginPage.jsx no longer waits on /api/init before
 * navigating on the plain student login path (see its redirectAfterAuth),
 * so a returning recruiter/TPO can land here before AppContext's role has
 * hydrated. Rather than guess, this gate reads the eventually-consistent
 * `role` at the END of the onboarding flow (once the quiz — which takes
 * meaningfully longer than a network round trip — is done) and bounces
 * them to their real dashboard then, instead of showing them a student
 * quiz. Known edge case: if hydration is still unresolved even at that
 * point (very slow backend), the person completes the quiz as a "student"
 * and only gets bounced on their next /dashboard visit — this is a soft UX
 * gate, not a security boundary, so that's an acceptable fallback rather
 * than something worth adding a loading flag to AppContext for right now.
 */
export default function OnboardingGate({ children }) {
  const [completedToday, setCompletedToday] = useState(() => hasCompletedQuizToday());
  const { role } = useAppContext();
  const navigate = useNavigate();

  function handleQuizComplete() {
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
      <DailyQuickQuiz onComplete={handleQuizComplete} />
    </DashboardLayout>
  );
}