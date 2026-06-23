import { Routes, Route } from "react-router-dom";
import PublicProfile from "./pages/PublicProfile";
import ProtectedRoute from "./components/ProtectedRoute";
import ThemeSelectionPage from "./pages/ThemeSelectionPage";
import ThemeConfirmationPage from "./pages/ThemeConfirmationPage";
import ThemeGate from "./routes/ThemeGate";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import ProblemsPage from "./pages/ProblemsPage";
import ProblemDetailsPage from "./pages/ProblemDetailsPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
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
  );
}

export default App;
