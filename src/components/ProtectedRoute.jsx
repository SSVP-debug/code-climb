import { useContext } from "react";

import { Navigate } from "react-router-dom";

import { AuthContext } from "../context/authContext";

function ProtectedRoute({
  children,
}) {

  const {
    user,
    loading,
  } = useContext(AuthContext);

  // Wait until Firebase checks auth
  if (loading) {

    return (

      <div className="min-h-screen bg-black text-white flex items-center justify-center">

        Loading...

      </div>

    );

  }

  // Not logged in
  if (!user) {

    return (
      <Navigate to="/login" />
    );

  }

  return children;

}

export default ProtectedRoute;