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
 * Student-only, by design: theme selection is a student "coding
 * personality" skin (see Navbar's isStudentThemed) and recruiter/TPO never
 * go through that onboarding step, so their themeId is permanently null.
 * Before this check, a recruiter/TPO opening a ThemeGate-wrapped shared
 * route (e.g. /profile, /settings) was redirected to /theme-selection every
 * time — a dead end, since nothing in their onboarding ever sets a theme.
 * Wait for isBackendReady before reading role, same as RoleRoute.jsx: role
 * defaults to "student" until /api/init resolves, so deciding on it any
 * earlier would let a real recruiter/TPO flash through this branch on a
 * fresh mount using the wrong (default) role.
 */
export default function ThemeGate({ children }) {
  const { themeId } = useTheme();
  const location = useLocation();
  const { role, isBackendReady } = useAppContext();

  if (isBackendReady && role !== "student") {
    return children;
  }

  if (!themeId) {
    // Encode current path as ?next= so ThemeSelectionPage can redirect back
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/theme-selection?next=${next}`} replace />;
  }

  return children;
}