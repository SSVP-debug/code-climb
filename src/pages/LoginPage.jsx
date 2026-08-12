import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { signInWithGoogle } from "../services/auth";
import { apiFetch } from "../services/api";
import { getPostLoginDestination, VALID_PORTAL_ROLES } from "../utils/roleRedirect";
import { getSafeNextPath } from "../utils/authRedirect";

// JARVIS pass, spec §1: "LOGIN → AUTHENTICATING → ... should feel like one
// continuous experience... the user should never wait just to watch an
// animation." STATUS_COPY below is display-only and strictly follows real
// promise state — nothing here introduces an artificial delay. "idle" is
// the only interactive state; "authenticating" covers the real Google
// popup round-trip; "redirecting" covers the real (already-in-flight)
// referral-apply/role-lookup work redirectAfterAuth was doing anyway.
// Deliberately no per-role copy ("Verifying admin access" etc.) — the
// account's real role isn't known until /api/init resolves, and stalling
// navigation just to show a role-specific label would be exactly the fake
// delay this pass explicitly rules out.
const STATUS_COPY = {
  authenticating: "Authenticating…",
  redirecting: "Access granted — entering Code Club…",
};

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
  // idle | authenticating | redirecting | error — see STATUS_COPY above.
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState(null);

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
    } catch {
      // Best-effort only — a failed referral apply shouldn't block login.
    }
  }

  // Gate 3 audit, P0-1: if ProtectedRoute (or the api.js 401 handler) sent
  // this person here with ?next=, that's a page they were actively trying
  // to reach — e.g. a shared contest link — and takes priority over the
  // role-based default below. Validated by getSafeNextPath so this can
  // never become an open redirect via a crafted ?next= value.
  const nextPath = getSafeNextPath(searchParams);

  // Figures out where this account actually belongs (real role, not the
  // card that was clicked) and navigates there.
  //
  // Audit fix (Plan 002 key finding): this used to always await /api/init
  // here just to read `role` before navigating anywhere — on a cold Render
  // backend (15-30s) that stalled every plain student login on this static
  // login card the whole time, even though AppContext
  // (src/context/appContext.jsx) already fires its own independent
  // /api/init the instant `user` is set, so the backend was already
  // loading in the background regardless. For the plain-login path (no
  // ?role= intent) we now navigate straight to /dashboard without waiting;
  // if this turns out to be a returning recruiter/TPO, OnboardingGate
  // (src/routes/OnboardingGate.jsx) bounces them to their real dashboard
  // once AppContext's role has hydrated.
  //
  // The portal-intent path (?role=recruiter|tpo) still waits: unlike the
  // plain path, getPostLoginDestination() there must distinguish "already
  // has this role, go to their dashboard" from "doesn't have it yet, go to
  // the signup form" — guessing wrong would send an existing recruiter to
  // the signup flow instead of their dashboard, a correctness bug, not
  // just a slow redirect. OnboardingGate can't fix that after the fact
  // because it only wraps /dashboard, not /recruiter/signup or
  // /tpo/signup.
  async function redirectAfterAuth() {
    setStatus("redirecting");
    await applyReferralIfPresent();
    if (nextPath) {
      navigate(nextPath);
      return;
    }

    if (!roleIntent) {
      navigate("/dashboard");
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
    // Same pre-existing pattern as useAdminDashboardMetrics.js/
    // useSystemHealth.js's effects — react-hooks/set-state-in-effect flags
    // this because redirectAfterAuth() now calls setStatus("redirecting")
    // (JARVIS pass §1's real-state status line). Kept consistent with that
    // established convention rather than a one-off fix.
    if (user) {
      redirectAfterAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setStatus("authenticating");
    const loggedInUser = await signInWithGoogle();
    if (loggedInUser) {
      redirectAfterAuth();
    } else {
      // signInWithGoogle() swallows the real error (services/auth.js) and
      // just returns undefined on cancel/failure — this is the honest
      // reflection of that, not a fabricated diagnostic.
      setStatus("idle");
      setErrorMsg("Sign-in didn't complete. Please try again.");
    }
  };

  // Set by api.js when a 401 is received — triggers a redirect here
  const sessionExpired =
    new URLSearchParams(window.location.search).get("reason") === "session_expired";

  // Set by Navbar's handleLogout after logoutUser() actually completes
  // (JARVIS pass, spec §19) — an honest "you're signed out" confirmation,
  // not a cinematic shutdown sequence.
  const justLoggedOut = searchParams.get("loggedOut") === "1";

  const busy = status !== "idle";

  return (
    <div className="h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="w-[400px] max-w-full animate-fadeIn" style={{ animationDuration: "0.35s" }}>
        <div className="flex items-center justify-center gap-1.5 mb-6">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-verdict-accept" />
          <span className="text-[11px] font-mono-ui uppercase tracking-[0.25em] text-zinc-500">
            Code Club
          </span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-2xl shadow-2xl shadow-black/40 text-center">
          <h1 className="text-3xl font-bold mb-3">{copy.heading}</h1>

          <p className="text-zinc-400 mb-8">{copy.sub}</p>

          {/* Session expired banner — shown when api.js redirects here after 401 */}
          {sessionExpired && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm px-4 py-3 rounded-xl mb-6">
              Your session expired. Please sign in again.
            </div>
          )}

          {/* Honest sign-out confirmation — only shown after a real, completed
              logout (see Navbar's handleLogout), never sessionExpired's twin. */}
          {justLoggedOut && !sessionExpired && (
            <div className="bg-verdict-accept/10 border border-verdict-accept/30 text-verdict-accept text-sm px-4 py-3 rounded-xl mb-6">
              You've been signed out.
            </div>
          )}

          {errorMsg && (
            <div className="bg-verdict-reject/10 border border-verdict-reject/30 text-verdict-reject text-sm px-4 py-3 rounded-xl mb-6">
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2.5 bg-white text-black py-3 rounded-xl font-semibold hover:bg-zinc-200 transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {busy && (
              <span
                aria-hidden="true"
                className="h-3.5 w-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin"
              />
            )}
            {busy ? STATUS_COPY[status] : "Continue with Google"}
          </button>

          {/* Real-state system-status language (JARVIS pass §1) — mirrors the
              admin command bar's mono-ui labels, not decoration on its own:
              only rendered while `status` reflects an actual in-flight
              promise (Google popup, referral apply, /api/init). */}
          {busy && (
            <p
              className="mt-3 text-[11px] font-mono-ui uppercase tracking-widest text-zinc-600"
              role="status"
              aria-live="polite"
            >
              {status === "authenticating" ? "Verifying with Google" : "Preparing your workspace"}
            </p>
          )}

          <p className="mt-6 text-xs text-zinc-600">
            Not the right account type?{" "}
            <a href="/portal" className="text-zinc-400 hover:text-white underline">
              Choose your access
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;