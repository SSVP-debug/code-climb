import {
  createContext,
  useEffect,
  useState,
} from "react";

import {
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";

import app from "../firebase/firebase";

export const AuthContext =
  createContext();

function AuthProvider({
  children,
}) {

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const auth = getAuth(app);

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {

          setUser(currentUser);

          setLoading(false);

        }
      );

    return () => unsubscribe();

  }, []);

  return (

    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
      }}
    >

      {children}

    </AuthContext.Provider>

  );
}

export default AuthProvider;