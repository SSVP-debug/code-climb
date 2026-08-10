import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ProtectedRoute from "../components/ProtectedRoute";
import RoleRoute from "../components/auth/RoleRoute";
import { ThemeProvider } from "../context/ThemeContext";
import AdminLayout from "./AdminLayout";
import AdminSettingsPage from "../pages/admin/AdminSettingsPage";
import AdminCollegesPage from "../pages/admin/AdminCollegesPage";
import { AuthContext } from "../context/authContext";
import { AppContext } from "../context/appContext";

// Navbar pulls in auth/notification/streak widgets unrelated to what this
// file is testing (the /admin/* role guard) — stub it like DashboardLayout's
// own tests stub theirs (see src/routes/OnboardingGate.test.jsx).
vi.mock("../components/Navbar", () => ({
  default: () => <nav data-testid="navbar-stub" />,
}));

// Plan 001, done criteria: "A non-admin account cannot reach any /admin/*
// path, verified for at least two distinct child paths, not just the
// parent." Mirrors the nested-route shape App.jsx actually mounts (guard
// once on the parent, AdminLayout's <Outlet /> resolves the child) rather
// than re-deriving a simplified tree, so this exercises the real
// composition instead of an approximation of it.
function DashboardProbe() {
  const location = useLocation();
  return <div>Dashboard: {location.pathname}</div>;
}

function renderAdmin({ user, loading = false, role }, initialEntries) {
  return render(
    <HelmetProvider>
      <ThemeProvider>
      <AuthContext.Provider value={{ user, loading }}>
        <AppContext.Provider value={{ role }}>
          <MemoryRouter initialEntries={initialEntries}>
            <Routes>
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <RoleRoute allowedRoles={["admin"]}>
                      <AdminLayout />
                    </RoleRoute>
                  </ProtectedRoute>
                }
              >
                <Route path="settings" element={<AdminSettingsPage />} />
                <Route path="colleges" element={<AdminCollegesPage />} />
              </Route>
              <Route path="/dashboard" element={<DashboardProbe />} />
              <Route path="/login" element={<div>Login Page</div>} />
            </Routes>
          </MemoryRouter>
        </AppContext.Provider>
      </AuthContext.Provider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

describe("Admin nested routes — role guard", () => {
  it("blocks a student account from /admin/settings", () => {
    renderAdmin(
      { user: { uid: "1" }, role: "student" },
      ["/admin/settings"]
    );

    expect(screen.queryByRole("heading", { name: "Settings" })).not.toBeInTheDocument();
    expect(screen.getByText("Dashboard: /dashboard")).toBeInTheDocument();
  });

  it("blocks a student account from /admin/colleges", () => {
    renderAdmin(
      { user: { uid: "1" }, role: "student" },
      ["/admin/colleges"]
    );

    expect(screen.queryByRole("heading", { name: "Colleges" })).not.toBeInTheDocument();
    expect(screen.getByText("Dashboard: /dashboard")).toBeInTheDocument();
  });

  it("blocks a logged-out visitor from /admin/settings", () => {
    renderAdmin(
      { user: null, role: undefined, loading: false },
      ["/admin/settings"]
    );

    expect(screen.queryByRole("heading", { name: "Settings" })).not.toBeInTheDocument();
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("allows an admin account to reach /admin/settings", async () => {
    renderAdmin(
      { user: { uid: "1" }, role: "admin" },
      ["/admin/settings"]
    );

    // AdminSettingsPage now does a real data fetch (plan 009) — same
    // findBy*-over-getBy* treatment as the colleges case below, and for
    // the same reason: the hook's async apiFetch rejection (no server in
    // this test env) needs to settle inside act() before the test ends.
    expect(await screen.findByRole("heading", { name: "Settings" })).toBeInTheDocument();
  });

  it("allows an admin account to reach /admin/colleges", async () => {
    renderAdmin(
      { user: { uid: "1" }, role: "admin" },
      ["/admin/colleges"]
    );

    // AdminCollegesPage now does a real data fetch (plan 005) — findBy*
    // waits for and wraps subsequent state updates in act(), unlike
    // getBy*, so the hook's async apiFetch rejection (no server in this
    // test env) settles cleanly before the test ends instead of firing
    // after teardown.
    expect(await screen.findByRole("heading", { name: "Colleges" })).toBeInTheDocument();
  });
});