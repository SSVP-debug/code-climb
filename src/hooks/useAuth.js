import { useContext } from "react";
import { AuthContext } from "../context/AuthContextObject";

// Convenience hook. Throws a clear error if used outside AuthProvider
// instead of silently returning null and crashing later.
//
// Usage: const { user, loading, signOut } = useAuth();
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "[useAuth] Must be used inside <AuthProvider>. " +
      "Did you wrap your app in main.jsx?"
    );
  }

  return context;
}
