import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../hooks/useAppContext";
import { getPostLoginDestination } from "../utils/roleRedirect";

/**
 * DashboardRoleRedirect — bounces a returning recruiter/TPO away from
 * /dashboard to their real dashboard once AppContext's role has hydrated.
 *
 * Extracted out of the now-removed OnboardingGate (formerly
 * src/routes/OnboardingGate.jsx), which used to do this as a side effect
 * of its own onboarding-completion callback. That component was replaced
 * by DailyQuizGuard (a stricter, server-backed, app-wide gate — see its
 * comment) which has nothing to do with role routing and wraps every
 * route, not just /dashboard, so this narrow concern needed its own home
 * rather than being bolted onto the quiz gate.
 *
 * Scoped to /dashboard only, same as OnboardingGate was — see
 * getPostLoginDestination's own comment for why /recruiter/signup and
 * /tpo/signup can't reuse this (a first-time pick needs to reach the
 * signup form, not get redirected back out of it).
 *
 * LoginPage's plain-login path deliberately navigates straight to
 * /dashboard without awaiting role hydration (see its own comment) to
 * avoid stalling every student login behind a cold Render backend — this
 * component is what corrects that guess for the recruiter/TPO case once
 * the real role comes back.
 */
export default function DashboardRoleRedirect({ children }) {
  const { role, isBackendReady } = useAppContext();
  const navigate = useNavigate();

  const destination = isBackendReady ? getPostLoginDestination(role, null) : "/dashboard";
  const needsRedirect = destination !== "/dashboard";

  useEffect(() => {
    if (needsRedirect) {
      navigate(destination, { replace: true });
    }
  }, [needsRedirect, destination, navigate]);

  // Don't flash the student Dashboard for a recruiter/TPO while the
  // redirect above is in flight.
  if (needsRedirect) {
    return null;
  }

  return children;
}
