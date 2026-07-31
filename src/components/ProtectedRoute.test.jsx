import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { AuthContext } from "../context/authContext";

function renderWithAuth(value, initialEntries = ["/protected"]) {
  return render(
    <AuthContext.Provider value={value}>
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

  it("renders children when user is authenticated", () => {
    renderWithAuth({
      user: { uid: "1" },
      loading: false,
    });

    expect(screen.getByText("Secret")).toBeInTheDocument();
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
