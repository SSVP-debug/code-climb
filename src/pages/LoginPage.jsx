import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { signInWithGoogle } from "../services/auth";

function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    const loggedInUser = await signInWithGoogle();
    if (loggedInUser) {
      navigate("/dashboard");
    }
  };

  // Set by api.js when a 401 is received — triggers a redirect here
  const sessionExpired =
    new URLSearchParams(window.location.search).get("reason") === "session_expired";

  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-zinc-900 p-10 rounded-2xl shadow-lg text-center w-[400px]">

        <h1 className="text-3xl font-bold mb-3">
          Welcome to Code Club
        </h1>

        <p className="text-zinc-400 mb-8">
          Continue your DSA journey
        </p>

        {/* Session expired banner — shown when api.js redirects here after 401 */}
        {sessionExpired && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm px-4 py-3 rounded-xl mb-6">
            Your session expired. Please sign in again.
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-zinc-200 transition"
        >
          Continue with Google
        </button>

      </div>
    </div>
  );
}

export default LoginPage;
