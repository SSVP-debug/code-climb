import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import ThemeGate from "./routes/ThemeGate";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Profile = lazy(() => import("./pages/Profile"));
const ProblemsPage = lazy(() => import("./pages/ProblemsPage"));
const ProblemDetailsPage = lazy(() => import("./pages/ProblemDetailsPage"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
const ThemeSelectionPage = lazy(() => import("./pages/ThemeSelectionPage"));
const ThemeConfirmationPage = lazy(() => import("./pages/ThemeConfirmationPage"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route
          path="/theme-selection"
          element={<ThemeSelectionPage />}
        />

        <Route
          path="/theme-confirmation"
          element={<ThemeConfirmationPage />}
        />
        <Route
          path="/"
          element={<LandingPage />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ThemeGate>
                <Dashboard />
              </ThemeGate>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <ThemeGate>
                <Analytics />
              </ThemeGate>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ThemeGate>
                <Profile />
              </ThemeGate>
            </ProtectedRoute>
          }
        />

        <Route
          path="/u/:username"
          element={<PublicProfile />}
        />

        <Route
          path="/problems"
          element={
            <ProtectedRoute>
              <ThemeGate>
                <ProblemsPage />
              </ThemeGate>
            </ProtectedRoute>
          }
        />




        <Route
          path="/problems/:slug"
          element={
            <ProtectedRoute>
              <ThemeGate>
                <ProblemDetailsPage />
              </ThemeGate>
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Routes>
    </Suspense>
  );
}

export default App;
