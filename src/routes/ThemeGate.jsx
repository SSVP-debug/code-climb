import { Navigate, useLocation } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";

/**
 * ThemeGate — blocks access to protected routes until a theme is selected.
 *
 * If no theme is set, redirects to /theme-selection with a `?next=` param
 * so the user lands on their intended page after picking a theme.
 *
 * ThemeSelectionPage must read this param and navigate to it after setTheme().
 */
export default function ThemeGate({ children }) {
  const { themeId } = useTheme();
  const location = useLocation();

  if (!themeId) {
    // Encode current path as ?next= so ThemeSelectionPage can redirect back
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/theme-selection?next=${next}`} replace />;
  }

  return children;
}
