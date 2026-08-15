import * as Sentry from "@sentry/react";
import {
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";

import { auth } from "../firebase/firebase";

import { AuthContext } from "./AuthContextObject";

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
      if (firebaseUser) {
        Sentry.setUser({ id: firebaseUser.uid, email: firebaseUser.email });
      } else {
        Sentry.setUser(null);  // clear on sign-out
      }
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
