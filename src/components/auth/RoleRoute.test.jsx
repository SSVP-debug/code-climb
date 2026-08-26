import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import RoleRoute from "./RoleRoute";
import { AuthContext } from "../../context/AuthContextObject";
import { AppContext } from "../../context/AppContextObject";
import { GuestContext } from "../../context/GuestContextObject";

const notGuestValue = {
  isGuest: false,
  guestPortal: null,
  enterGuestMode: () => {},
  exitGuestMode: () => {},
};

function DashboardProbe() {
  const location = useLocation();
  return <div>Dashboard: {location.pathname}</div>;
}

function LoginProbe() {
  return <div>Login Page</div>;
}

function renderRoleRoute({
  authValue,
  appValue,
  guestValue = notGuestValue,
  allowedRoles = ["recruiter", "admin"],
  initialEntries = ["/recruiter/dashboard"],
}) {
  return render(
    <AuthContext.Provider value={authValue}>
      <GuestContext.Provider value={guestValue}>
        <AppContext.Provider value={appValue}>
          <MemoryRouter initialEntries={initialEntries}>
            <Routes>
              <Route
                path="/recruiter/dashboard"
                element={
                  <RoleRoute allowedRoles={allowedRoles}>
                    <div>Recruiter Content</div>
                  </RoleRoute>
                }
              />
              <Route path="/dashboard" element={<DashboardProbe />} />
              <Route path="/login" element={<LoginProbe />} />
            </Routes>
          </MemoryRouter>
        </AppContext.Provider>
      </GuestContext.Provider>
    </AuthContext.Provider>
  );
}

describe("RoleRoute", () => {
  it("shows nothing while auth is still loading", () => {
    const { container } = renderRoleRoute({
      authValue: { user: null, loading: true },
      appValue: { role: "student", isBackendReady: true },
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("redirects to /login for an unauthenticated, non-guest visitor", () => {
    renderRoleRoute({
      authValue: { user: null, loading: false },
      appValue: { role: "student", isBackendReady: true },
    });
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("renders children for an authenticated user whose role is in allowedRoles", () => {
    renderRoleRoute({
      authValue: { user: { uid: "1" }, loading: false },
      appValue: { role: "recruiter", isBackendReady: true },
    });
    expect(screen.getByText("Recruiter Content")).toBeInTheDocument();
  });

  it("redirects to /dashboard for an authenticated user whose role is NOT in allowedRoles", () => {
    renderRoleRoute({
      authValue: { user: { uid: "1" }, loading: false },
      appValue: { role: "student", isBackendReady: true },
    });
    expect(screen.getByText("Dashboard: /dashboard")).toBeInTheDocument();
  });

  it("waits (renders nothing) until isBackendReady, even for an authenticated user", () => {
    const { container } = renderRoleRoute({
      authValue: { user: { uid: "1" }, loading: false },
      appValue: { role: "student", isBackendReady: false },
    });
    expect(container).toBeEmptyDOMElement();
  });
});

// Guest Mode bypass — a guest has no Firebase user, so without this branch
// every guest would be redirected to /login by the very first check.
describe("RoleRoute — Guest Mode bypass", () => {
  it("renders children for a guest whose portal (via AppContext's role) is in allowedRoles", () => {
    renderRoleRoute({
      authValue: { user: null, loading: false },
      appValue: { role: "recruiter", isBackendReady: true },
      guestValue: { isGuest: true, guestPortal: "recruiter", enterGuestMode: () => {}, exitGuestMode: () => {} },
    });
    expect(screen.getByText("Recruiter Content")).toBeInTheDocument();
  });

  it("redirects to /dashboard (not /login) for a guest whose portal is NOT in allowedRoles", () => {
    renderRoleRoute({
      authValue: { user: null, loading: false },
      appValue: { role: "student", isBackendReady: true },
      guestValue: { isGuest: true, guestPortal: "student", enterGuestMode: () => {}, exitGuestMode: () => {} },
    });
    expect(screen.getByText("Dashboard: /dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("never blocks a guest on isBackendReady — a guest's isBackendReady is always true (set by appContext.jsx immediately)", () => {
    renderRoleRoute({
      authValue: { user: null, loading: false },
      appValue: { role: "recruiter", isBackendReady: true },
      guestValue: { isGuest: true, guestPortal: "recruiter", enterGuestMode: () => {}, exitGuestMode: () => {} },
    });
    expect(screen.getByText("Recruiter Content")).toBeInTheDocument();
  });

  it("still redirects to /login for a non-guest, unauthenticated visitor on the same route", () => {
    renderRoleRoute({
      authValue: { user: null, loading: false },
      appValue: { role: "student", isBackendReady: true },
      guestValue: { isGuest: false, guestPortal: null, enterGuestMode: () => {}, exitGuestMode: () => {} },
    });
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });
});
