import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAppContext } from "../../context/AppContext";

export default function RoleRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  const { user: appUser, loading: appLoading } = useAppContext();

  if (loading || appLoading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(appUser?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}