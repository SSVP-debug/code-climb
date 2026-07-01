import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import ThemeGate from "./routes/ThemeGate";

// ── Eagerly loaded ─────────────────────────────────────────────────────────
// These are tiny and needed immediately on first paint.
// LandingPage: first thing any visitor sees — no delay acceptable.
// LoginPage: auth flow must be instant.
// NotFoundPage: tiny, no reason to split.
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";

// ── Lazily loaded ──────────────────────────────────────────────────────────
// Each lazy() call creates a separate JS chunk.
// React only downloads + executes a chunk when the user first navigates to it.
// Monaco Editor lives inside ProblemDetailsPage — the single biggest win here.
// Before: Monaco downloaded on app init for every user (including those who never open a problem).
// After:  Monaco only downloads when a user opens a problem page.
const Dashboard            = lazy(() => import("./pages/Dashboard"));
const Analytics            = lazy(() => import("./pages/Analytics"));
const Profile              = lazy(() => import("./pages/Profile"));
const ProblemsPage         = lazy(() => import("./pages/ProblemsPage"));
const ProblemDetailsPage   = lazy(() => import("./pages/ProblemDetailsPage"));
const PublicProfile        = lazy(() => import("./pages/PublicProfile"));
const ThemeSelectionPage   = lazy(() => import("./pages/ThemeSelectionPage"));
const ThemeConfirmationPage = lazy(() => import("./pages/ThemeConfirmationPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const InterviewModePage = lazy(() => import("./pages/InterviewModePage"));
const PricingPage       = lazy(() => import("./pages/PricingPage"));
const TpoSignupPage    = lazy(() => import("./pages/TpoSignupPage"));
const TpoDashboardPage = lazy(() => import("./pages/TpoDashboardPage"));

// ── Route-level loading fallback ───────────────────────────────────────────
// Shown while a chunk is downloading. Matches the app's dark background
// so there's no white flash during navigation.
function PageLoader() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm">Loading…</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* ── Public routes ──────────────────────────────────────────────── */}
        <Route path="/"        element={<LandingPage />} />
        <Route path="/login"   element={<LoginPage />} />
        <Route path="/u/:username" element={<PublicProfile />} />

        {/* ── Theme setup (semi-public — no ThemeGate wrapping needed) ───── */}
        <Route path="/theme-selection"   element={<ThemeSelectionPage />} />
        <Route path="/theme-confirmation" element={<ThemeConfirmationPage />} />

        {/* ── Protected routes ───────────────────────────────────────────── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ThemeGate><Dashboard /></ThemeGate>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <ThemeGate><Analytics /></ThemeGate>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ThemeGate><Profile /></ThemeGate>
            </ProtectedRoute>
          }
        />

        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <ThemeGate><LeaderboardPage /></ThemeGate>
            </ProtectedRoute>
          }
        />

        <Route
          path="/problems"
          element={
            <ProtectedRoute>
              <ThemeGate><ProblemsPage /></ThemeGate>
            </ProtectedRoute>
          }
        />

        <Route path="/tpo/signup"   element={<TpoSignupPage />} />
        <Route
          path="/tpo/dashboard"
          element={<ProtectedRoute><TpoDashboardPage /></ProtectedRoute>}
        />

        <Route
          path="/pricing"
          element={
            <ProtectedRoute>
              <ThemeGate><PricingPage /></ThemeGate>
            </ProtectedRoute>
          }
        />

        <Route
          path="/interview/:slug"
          element={
            <ProtectedRoute>
              <ThemeGate><InterviewModePage /></ThemeGate>
            </ProtectedRoute>
          }
        />

        {/* ProblemDetailsPage contains Monaco Editor (~3MB chunk).         */}
        {/* Lazy-loading this route alone saves ~60% of initial bundle.     */}
        <Route
          path="/problems/:slug"
          element={
            <ProtectedRoute>
              <ThemeGate><ProblemDetailsPage /></ThemeGate>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </Suspense>
  );
}

export default App;
