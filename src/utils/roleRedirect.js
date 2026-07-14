/**
 * roleRedirect — single source of truth for "where does this account go
 * after auth". Used by LoginPage today; the Phase C admin View-As switcher
 * will reuse the same map instead of re-deriving it.
 *
 * Two inputs matter, and they can disagree:
 *   - `role`   — the ACTUAL role on the User document (source of truth).
 *   - `intent` — the role the person clicked on /portal (?role=... on the
 *                /login URL). Only relevant when they don't have that role
 *                yet — it tells us which upgrade flow to drop them into.
 *
 * A returning recruiter/tpo always lands on their real dashboard regardless
 * of which portal card they clicked this time — clicking "Student" doesn't
 * downgrade a recruiter, and clicking "Recruiter" doesn't grant a student
 * recruiter access. Verification-pending accounts still go to their real
 * dashboard: RecruiterDashboardPage / TpoDashboardPage already render a
 * "pending verification" state themselves, so no separate holding page
 * is needed here.
 */

export const VALID_PORTAL_ROLES = ["student", "recruiter", "tpo"];

export function getPostLoginDestination(role, intent) {
  if (role === "recruiter") return "/recruiter/dashboard";
  if (role === "tpo") return "/tpo/dashboard";
  if (role === "admin") return "/dashboard";

  // role is "student" (or unset) — the account has not upgraded yet.
  // Route by what they clicked on /portal, so a first-time Recruiter/TPO
  // pick lands them in the right signup form instead of the student home.
  if (intent === "recruiter") return "/recruiter/signup";
  if (intent === "tpo") return "/tpo/signup";

  return "/dashboard";
}