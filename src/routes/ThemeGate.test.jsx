import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ThemeGate from "./ThemeGate";

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/profile", search: "" }),
  Navigate: ({ to }) => <div data-testid="navigate" data-to={to} />,
}));

let themeValue = { themeId: null };
vi.mock("../hooks/useTheme", () => ({
  useTheme: () => themeValue,
}));

let appContextValue = { role: "student" };
vi.mock("../hooks/useAppContext", () => ({
  useAppContext: () => appContextValue,
}));

// Admin UX audit (Phase UI-3, P0): an admin's own account menu links
// (View Profile/Settings/Pricing) all route through ThemeGate-wrapped
// pages. Admin accounts never have a themeId set — theming is a
// student-facing concept AdminLayout never applies — so without this
// bypass, every admin hit a "Choose Your Code Club Universe" wall before
// reaching their own settings. This locks in the fix: admin skips the
// gate entirely; every other role's behavior (student/recruiter/tpo — not
// this phase's ownership) is completely unchanged.
describe("ThemeGate", () => {
  beforeEach(() => {
    appContextValue = { role: "student", isBackendReady: true };
    themeValue = { themeId: null };
  });

  it("renders children directly for admin, even with no themeId set", () => {
    appContextValue = { role: "admin", isBackendReady: true };
    themeValue = { themeId: null };

    render(
      <ThemeGate>
        <div>protected content</div>
      </ThemeGate>
    );

    expect(screen.getByText("protected content")).toBeInTheDocument();
    expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
  });

  it("still redirects a student with no themeId to theme-selection", () => {
    appContextValue = { role: "student", isBackendReady: true };
    themeValue = { themeId: null };

    render(
      <ThemeGate>
        <div>protected content</div>
      </ThemeGate>
    );

    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
    expect(screen.getByTestId("navigate")).toHaveAttribute(
      "data-to",
      "/theme-selection?next=%2Fprofile"
    );
  });

  it("still shows children directly once a student has a themeId", () => {
    appContextValue = { role: "student", isBackendReady: true };
    themeValue = { themeId: "hacker" };

    render(
      <ThemeGate>
        <div>protected content</div>
      </ThemeGate>
    );

    expect(screen.getByText("protected content")).toBeInTheDocument();
  });

  it("renders nothing (not a premature redirect) while role hasn't hydrated yet and there's no themeId", () => {
    // The exact race RoleRoute.jsx already guards against: role reads as
    // the "student" default for one render before /api/init resolves.
    // A real admin must not get bounced to /theme-selection during that
    // window just because role hasn't caught up to "admin" yet.
    appContextValue = { role: "student", isBackendReady: false };
    themeValue = { themeId: null };

    render(
      <ThemeGate>
        <div>protected content</div>
      </ThemeGate>
    );

    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
    expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
  });

  it("does not wait on isBackendReady when a themeId is already set — no new delay for the common case", () => {
    appContextValue = { role: "student", isBackendReady: false };
    themeValue = { themeId: "hacker" };

    render(
      <ThemeGate>
        <div>protected content</div>
      </ThemeGate>
    );

    expect(screen.getByText("protected content")).toBeInTheDocument();
  });
});