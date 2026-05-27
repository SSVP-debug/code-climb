import { signInWithGoogle } from "../services/auth";
import { useNavigate } from "react-router-dom";
import { useContext, useEffect } from "react";
import { AuthContext } from "../context/authContext";

function LoginPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    const user = await signInWithGoogle();

    if (user) {
      console.log("Logged in user:", user);
      navigate("/dashboard");
    }
  };



  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-zinc-900 p-10 rounded-2xl shadow-lg text-center w-[400px]">
        <h1 className="text-3xl font-bold mb-3">Welcome to Code Climb</h1>

        <p className="text-zinc-400 mb-8">
          Continue your DSA journey
        </p>

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