import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import { AuthContext } from "../context/authContext";

function renderWithAuth(value) {
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Secret</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("ProtectedRoute", () => {
  it("shows loading while auth is resolving", () => {
    renderWithAuth({ user: null, loading: true });

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("redirects to login when user is not authenticated", () => {
    renderWithAuth({ user: null, loading: false });

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("renders children when user is authenticated", () => {
    renderWithAuth({
      user: { uid: "1" },
      loading: false,
    });

    expect(screen.getByText("Secret")).toBeInTheDocument();
  });
});
