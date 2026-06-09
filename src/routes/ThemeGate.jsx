import { Navigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function ThemeGate({ children }) {
  const { themeId } = useTheme();

  if (!themeId) {
    return <Navigate to="/theme-selection" replace />;
  }

  return children;
}