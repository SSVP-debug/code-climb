import {
  useEffect,
  useState,
} from "react";

import {
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";

import app from "../firebase/firebase";
import { AuthContext } from "./authContext";

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

  }, [auth]);

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
