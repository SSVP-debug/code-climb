import { Navigate, useLocation } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useAppContext } from "../hooks/useAppContext";

/**
 * ThemeGate — blocks access to protected routes until a theme is selected.
 *
 * If no theme is set, redirects to /theme-selection with a `?next=` param
 * so the user lands on their intended page after picking a theme.
 *
 * ThemeSelectionPage must read this param and navigate to it after setTheme().
 *
 * Admin UX audit (Phase UI-3, P0 — found while checking the admin's own
 * account menu, not the console itself): AvatarDropdown's "View Profile",
 * "Settings", and "Pricing" links are shown to every role, admin included,
 * and all three routes (/profile, /settings, /pricing) are ThemeGate-
 * wrapped with no role exception. An admin account has no legitimate
 * reason to ever pick a "Code Club Universe" theme — themes are a
 * student-facing gamification concept, AdminLayout doesn't apply one, and
 * ThemeSkin is never rendered inside the admin console. So an admin who's
 * never touched student theming (i.e. every admin account, typically)
 * gets bounced into that student onboarding flow — jarring, off-brand,
 * and the opposite of the "calm, precise, trustworthy" standard this
 * phase is enforcing on the admin experience.
 * This is a shared-infrastructure change (ThemeGate wraps routes used by
 * every role, not just admin), so it's scoped as narrowly as possible:
 * only role === "admin" skips the gate. Student/Recruiter/TPO behavior
 * (UI-1/UI-2's ownership) is completely unchanged. Recorded for UI-4.
 *
 * `isBackendReady` guard: `role` in AppContext defaults to "student"
 * until /api/init resolves (see appContext.jsx) — RoleRoute.jsx already
 * documents this exact race for its own role check. Without waiting for
 * it here too, every admin would still hit the redirect for one render
 * on a fresh page load (role reads as the "student" default the instant
 * before hydration finishes). Scoped narrowly to avoid changing this
 * gate's behavior for everyone else: only deferred when there's no
 * themeId yet AND the role hasn't resolved — a student/recruiter/tpo who
 * already has a themeId keeps rendering immediately with zero wait,
 * exactly as before this change.
 */
export default function ThemeGate({ children }) {
  const { themeId } = useTheme();
  const { role, isBackendReady } = useAppContext();
  const location = useLocation();

  if (!themeId && !isBackendReady) return null;

  if (role === "admin") {
    return children;
  }

  if (!themeId) {
    // Encode current path as ?next= so ThemeSelectionPage can redirect back
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/theme-selection?next=${next}`} replace />;
  }

  return children;
}