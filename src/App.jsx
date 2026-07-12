import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/auth/RoleRoute";
import ThemeGate from "./routes/ThemeGate";

// ── Eagerly loaded ─────────────────────────────────────────────────────────
// These are tiny and needed immediately on first paint.
// LandingPage: first thing any visitor sees — no delay acceptable.
// LoginPage: auth flow must be instant.
// NotFoundPage: tiny, no reason to split.
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import SettingsPage from "./pages/SettingsPage";

// ── Lazily loaded ──────────────────────────────────────────────────────────
// Each lazy() call creates a separate JS chunk.
// React only downloads + executes a chunk when the user first navigates to it.
// Monaco Editor lives inside ProblemDetailsPage — the single biggest win here.
// Before: Monaco downloaded on app init for every user (including those who never open a problem).
// After:  Monaco only downloads when a user opens a problem page.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Profile = lazy(() => import("./pages/Profile"));
const ProblemsPage = lazy(() => import("./pages/ProblemsPage"));
const ProblemDetailsPage = lazy(() => import("./pages/ProblemDetailsPage"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const ThemeSelectionPage = lazy(() => import("./pages/ThemeSelectionPage"));
const ThemeConfirmationPage = lazy(() => import("./pages/ThemeConfirmationPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const ClubPage = lazy(() => import("./pages/ClubPage"));
const RecruiterSignupPage = lazy(() => import("./pages/RecruiterSignupPage"));
const RecruiterDashboardPage = lazy(() => import("./pages/RecruiterDashboardPage"));
const CandidateTestsPage = lazy(() => import("./pages/CandidateTestsPage"));
const CertificationsPage = lazy(() => import("./pages/CertificationsPage"));
const CertVerifyPage = lazy(() => import("./pages/CertVerifyPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const ContestsPage = lazy(() => import("./pages/ContestsPage"));
const ContestDetailPage = lazy(() => import("./pages/ContestDetailPage"));
const AmbassadorPage = lazy(() => import("./pages/AmbassadorPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const InterviewModePage = lazy(() => import("./pages/InterviewModePage"));
const TpoSignupPage = lazy(() => import("./pages/TpoSignupPage"));
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
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/u/:username" element={<PublicProfile />} />

        {/* ── Theme setup (semi-public — no ThemeGate wrapping needed) ───── */}
        <Route path="/theme-selection" element={<ThemeSelectionPage />} />
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
        <Route path="/settings" element={<SettingsPage />} />

        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <ThemeGate><LeaderboardPage /></ThemeGate>
            </ProtectedRoute>
          }
        />

        {/* ── Club hub — consolidates Leaderboard, Contests, Ambassador ──── */}
        <Route
          path="/club"
          element={
            <ProtectedRoute>
              <ThemeGate><ClubPage /></ThemeGate>
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

        <Route
          path="/tpo/signup"
          element={
            <ProtectedRoute>
              <TpoSignupPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tpo/dashboard"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["tpo", "admin"]}>
                <TpoDashboardPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />


        {/* ── Phase 7: Recruiter ──────────────────────────────────────── */}
        <Route path="/recruiter/signup" element={<ProtectedRoute><RecruiterSignupPage /></ProtectedRoute>} />
        <Route
          path="/recruiter/dashboard"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["recruiter", "admin"]}>
                <RecruiterDashboardPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* ── Phase 7: Candidate tests ────────────────────────────────── */}
        <Route path="/candidate/tests" element={<ProtectedRoute><CandidateTestsPage /></ProtectedRoute>} />

        {/* ── Phase 7: Certifications ─────────────────────────────────── */}
        <Route path="/certifications" element={<ProtectedRoute><ThemeGate><CertificationsPage /></ThemeGate></ProtectedRoute>} />
        <Route path="/verify/:code" element={<CertVerifyPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* ── Phase 7: Contests ───────────────────────────────────────── */}
        <Route path="/contests" element={<ProtectedRoute><ThemeGate><ContestsPage /></ThemeGate></ProtectedRoute>} />
        <Route path="/contests/:id" element={<ProtectedRoute><ThemeGate><ContestDetailPage /></ThemeGate></ProtectedRoute>} />

        {/* ── Phase 8: Campus Ambassador Portal ──────────────────────── */}
        <Route path="/ambassador" element={<ProtectedRoute><ThemeGate><AmbassadorPage /></ThemeGate></ProtectedRoute>} />

        {/* ── Phase 9: Pricing Page ───────────────────────────────────── */}
        <Route
          path="/pricing"
          element={
            <ProtectedRoute>
              <ThemeGate>
                <PricingPage />
              </ThemeGate>
            </ProtectedRoute>
          }
        />
        {/* ── Phase 10: Interview Mode ────────────────────────────────── */}
        <Route
          path="/interview-mode"
          element={
            <ProtectedRoute>
              <ThemeGate>
                <InterviewModePage />
              </ThemeGate>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />

      </Routes>
    </Suspense>
  );
}

export default App;