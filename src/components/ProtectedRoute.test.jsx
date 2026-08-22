import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { AuthContext } from "../context/AuthContextObject";
import { DailyQuizContext } from "../context/DailyQuizContextObject";

// DailyQuickQuiz owns the actual question UI and is covered by its own
// tests — stub it down to a single button that calls onComplete, same
// pattern DailyQuizGate.test.jsx uses.
vi.mock("../components/onboarding/DailyQuickQuiz", () => ({
  default: ({ onComplete }) => (
    <button onClick={() => onComplete({ score: 5 })}>finish quiz</button>
  ),
}));

const unlockedQuizValue = {
  status: "unlocked",
  isBackendReady: true,
  retry: vi.fn(),
  completeQuiz: vi.fn(),
  completing: false,
  completeError: null,
};

function renderWithAuth(authValue, initialEntries = ["/protected"], quizValue = unlockedQuizValue) {
  return render(
    <AuthContext.Provider value={authValue}>
      <DailyQuizContext.Provider value={quizValue}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Secret</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/club/public-contests/:id"
              element={
                <ProtectedRoute>
                  <div>Contest Detail</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/login"
              element={<LoginRouteProbe />}
            />
          </Routes>
        </MemoryRouter>
      </DailyQuizContext.Provider>
    </AuthContext.Provider>
  );
}

// Renders the current /login URL (path + search) so tests can assert on
// exactly what ProtectedRoute encoded, without needing a real LoginPage.
function LoginRouteProbe() {
  const location = useLocation();
  return <div>Login Page: {location.pathname + location.search}</div>;
}

describe("ProtectedRoute", () => {
  it("shows loading while auth is resolving", () => {
    renderWithAuth({ user: null, loading: true });

    expect(
      document.querySelector('[class*="animate-spin"]')
    ).not.toBeNull();
  });

  it("redirects to login when user is not authenticated", () => {
    renderWithAuth({ user: null, loading: false });

    expect(screen.getByText("Login Page: /login?next=%2Fprotected")).toBeInTheDocument();
  });

  it("renders children when user is authenticated and today's quiz is already unlocked", () => {
    renderWithAuth({
      user: { uid: "1" },
      loading: false,
    });

    expect(screen.getByText("Secret")).toBeInTheDocument();
  });

  // Fix verified here: the Daily Quiz Gate must only ever appear in place
  // of an actual protected page (reached through ProtectedRoute), never
  // over a public route — this test is the authenticated+gated case,
  // proving the quiz screen (not "Secret") is what renders when required.
  it("renders the daily quiz — not the page's children — when today's quiz is required", () => {
    renderWithAuth(
      { user: { uid: "1" }, loading: false },
      ["/protected"],
      { ...unlockedQuizValue, status: "required" }
    );

    expect(screen.getByText("finish quiz")).toBeInTheDocument();
    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
  });

  it("does not silently render children while the quiz status is still loading", () => {
    renderWithAuth(
      { user: { uid: "1" }, loading: false },
      ["/protected"],
      { ...unlockedQuizValue, status: "loading" }
    );

    expect(screen.queryByText("Secret")).not.toBeInTheDocument();
    expect(screen.queryByText("finish quiz")).not.toBeInTheDocument();
  });

  // Gate 3 audit, P0-1: a logged-out visitor following a contest link must
  // be able to get back to that exact contest after signing in — the
  // redirect to /login must preserve the page they were trying to reach.
  it("preserves the intended destination as ?next= when redirecting to login", () => {
    renderWithAuth(
      { user: null, loading: false },
      ["/club/public-contests/abc123?utm_source=fest"]
    );

    expect(
      screen.getByText("Login Page: /login?next=%2Fclub%2Fpublic-contests%2Fabc123%3Futm_source%3Dfest")
    ).toBeInTheDocument();
  });
});
