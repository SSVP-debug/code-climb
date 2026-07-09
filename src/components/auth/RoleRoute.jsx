import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/authContext";
import { useAppContext } from "../../hooks/useAppContext";

export default function RoleRoute({ allowedRoles, children }) {
  const { user, loading } = useContext(AuthContext);
  const { role } = useAppContext();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}