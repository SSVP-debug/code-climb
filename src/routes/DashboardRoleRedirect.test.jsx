import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardRoleRedirect from "./DashboardRoleRedirect";

const navigateMock = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

let appContextValue = { role: "student", isBackendReady: true };
vi.mock("../hooks/useAppContext", () => ({
  useAppContext: () => appContextValue,
}));

describe("DashboardRoleRedirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appContextValue = { role: "student", isBackendReady: true };
  });

  it("renders the Dashboard for a student", () => {
    appContextValue = { role: "student", isBackendReady: true };

    render(
      <DashboardRoleRedirect>
        <div>Dashboard content</div>
      </DashboardRoleRedirect>
    );

    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("renders the Dashboard (not null forever) before role has hydrated, without redirecting yet", () => {
    appContextValue = { role: "student", isBackendReady: false };

    render(
      <DashboardRoleRedirect>
        <div>Dashboard content</div>
      </DashboardRoleRedirect>
    );

    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("redirects a recruiter to their real dashboard instead of revealing the student dashboard", () => {
    appContextValue = { role: "recruiter", isBackendReady: true };

    render(
      <DashboardRoleRedirect>
        <div>Dashboard content</div>
      </DashboardRoleRedirect>
    );

    expect(navigateMock).toHaveBeenCalledWith("/recruiter/dashboard?tab=candidates", {
      replace: true,
    });
    expect(screen.queryByText("Dashboard content")).not.toBeInTheDocument();
  });

  it("redirects a TPO to their real dashboard instead of revealing the student dashboard", () => {
    appContextValue = { role: "tpo", isBackendReady: true };

    render(
      <DashboardRoleRedirect>
        <div>Dashboard content</div>
      </DashboardRoleRedirect>
    );

    expect(navigateMock).toHaveBeenCalledWith("/tpo/dashboard?tab=overview", { replace: true });
    expect(screen.queryByText("Dashboard content")).not.toBeInTheDocument();
  });

  it("renders the Dashboard for admin", () => {
    appContextValue = { role: "admin", isBackendReady: true };

    render(
      <DashboardRoleRedirect>
        <div>Dashboard content</div>
      </DashboardRoleRedirect>
    );

    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
