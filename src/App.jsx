import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import ProblemsPage from "./pages/ProblemsPage";
import ProblemDetailsPage from "./pages/ProblemDetailsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/problems" element={<ProtectedRoute><ProblemsPage /></ProtectedRoute>} />
      <Route path="/problems/:title" element={<ProtectedRoute><ProblemDetailsPage /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;