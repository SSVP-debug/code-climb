import { useAuth } from "../context/authContext";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Firebase is still resolving the persisted session.
  // Show a spinner — do NOT redirect yet. Redirecting here would kick
  // logged-in users to /login on every page refresh.
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-[var(--theme-primary,#2dd4bf)] rounded-full animate-spin" />
      </div>
    );
  }

  // Firebase has resolved — no user means not authenticated.
  if (!user) {
    // `replace` prevents this redirect from being added to browser history.
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;