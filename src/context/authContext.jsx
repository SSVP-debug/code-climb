import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";

import { auth } from "../firebase/firebase";

// ── Context ────────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

// ── Provider ───────────────────────────────────────────────────────────────
// Wrap your entire app with this in main.jsx:
//   <AuthProvider>
//     <App />
//   </AuthProvider>
//
// It fires onAuthStateChanged once on mount, sets user + loading,
// and cleans up the listener on unmount.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Start as true — Firebase needs one tick to resolve auth state.
  // ProtectedRoute reads this to avoid flashing /login before Firebase responds.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged fires immediately with the persisted session (if any),
    // then again whenever the user signs in or out.
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
      setLoading(false);
    });

    // Cleanup: stops the Firebase listener when the component unmounts.
    // Without this, the listener stays alive and tries to setState on an
    // unmounted component — memory leak + React warning.
    return () => unsubscribe();
  }, []);

  // Centralised sign-out so any component can call signOut without
  // importing firebase/auth directly.
  async function signOut() {
    await firebaseSignOut(auth);
    // onAuthStateChanged will set user to null automatically.
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── useAuth hook ───────────────────────────────────────────────────────────
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