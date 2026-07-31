import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { signInWithGoogle } from "../services/auth";
import { apiFetch } from "../services/api";
import { getPostLoginDestination, VALID_PORTAL_ROLES } from "../utils/roleRedirect";
import { getSafeNextPath } from "../utils/authRedirect";

// Copy tailored per portal intent — same Google sign-in either way, just a
// headline that matches the card the person tapped on /portal.
const ROLE_COPY = {
  student: {
    heading: "Sign in as a Student",
    sub: "Continue your DSA journey",
  },
  recruiter: {
    heading: "Sign in as a Recruiter",
    sub: "Search verified candidates and send skills tests",
  },
  tpo: {
    heading: "Sign in as a TPO",
    sub: "Track placement readiness across your campus",
  },
};

function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");

  const roleParamRaw = searchParams.get("role");
  const roleIntent = VALID_PORTAL_ROLES.includes(roleParamRaw) ? roleParamRaw : null;
  const copy = ROLE_COPY[roleIntent] || {
    heading: "Welcome to Code Club",
    sub: "Continue your DSA journey",
  };

  // Apply referral code after login if present in URL
  async function applyReferralIfPresent() {
    if (!refCode) return;
    try {
      await apiFetch("/api/referral/apply", {
        method: "POST",
        body: JSON.stringify({ code: refCode }),
      });
    } catch {}
  }

  // Gate 3 audit, P0-1: if ProtectedRoute (or the api.js 401 handler) sent
  // this person here with ?next=, that's a page they were actively trying
  // to reach — e.g. a shared contest link — and takes priority over the
  // role-based default below. Validated by getSafeNextPath so this can
  // never become an open redirect via a crafted ?next= value.
  const nextPath = getSafeNextPath(searchParams);

  // Figures out where this account actually belongs (real role, not the
  // card that was clicked) and navigates there. /api/init already returns
  // `role` on every boot, so no extra endpoint is needed for this.
  async function redirectAfterAuth() {
    await applyReferralIfPresent();
    if (nextPath) {
      navigate(nextPath);
      return;
    }
    try {
      const { user: bootUser } = await apiFetch("/api/init");
      navigate(getPostLoginDestination(bootUser?.role, roleIntent));
    } catch {
      // If /api/init fails (e.g. DB blip), fall back to the plain
      // dashboard rather than stranding the person mid-login.
      navigate("/dashboard");
    }
  }

  const { user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      redirectAfterAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    const loggedInUser = await signInWithGoogle();
    if (loggedInUser) {
      redirectAfterAuth();
    }
  };

  // Set by api.js when a 401 is received — triggers a redirect here
  const sessionExpired =
    new URLSearchParams(window.location.search).get("reason") === "session_expired";

  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-zinc-900 p-10 rounded-2xl shadow-lg text-center w-[400px]">

        <h1 className="text-3xl font-bold mb-3">
          {copy.heading}
        </h1>

        <p className="text-zinc-400 mb-8">
          {copy.sub}
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

        <p className="mt-6 text-xs text-zinc-600">
          Not the right account type?{" "}
          <a href="/portal" className="text-zinc-400 hover:text-white underline">
            Choose your access
          </a>
        </p>

      </div>
    </div>
  );
}

export default LoginPage;