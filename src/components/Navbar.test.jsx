import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthContext } from "../context/authContext";
import { AppContext } from "../context/appContext";
import Navbar from "./Navbar";

// Navbar transformation, Phase A. Prior to this file, Navbar had no direct
// test coverage — only exercised indirectly (and stubbed out) by layout
// tests like AdminLayout.test.jsx. This covers what actually changed: the
// role-aware workspace label in the brand block, and that the
// WorkspaceSwitcher only appears for admin (the one role with a real
// concept of "other workspaces" — see src/config/workspaces.js).
//
// AvatarDropdown/NotificationBell/StreakBadge are stubbed: they pull in
// apiFetch/PremiumContext/achievement metadata unrelated to what's under
// test here, same reasoning AdminLayout.test.jsx gives for stubbing
// Navbar itself.
vi.mock("./AvatarDropdown", () => ({
  default: () => <div data-testid="avatar-stub" />,
}));
vi.mock("./notifications/NotificationBell", () => ({
  default: () => <div data-testid="notification-bell-stub" />,
}));
vi.mock("./common/StreakBadge", () => ({
  default: () => <div data-testid="streak-badge-stub" />,
}));

function renderNavbar({ role, user = { displayName: "Test User", email: "test@example.com" } }) {
  return render(
    <ThemeProvider>
      <AuthContext.Provider value={{ user, loading: false }}>
        <AppContext.Provider value={{ role, currentStreak: 0 }}>
          <MemoryRouter initialEntries={["/dashboard"]}>
            <Navbar />
          </MemoryRouter>
        </AppContext.Provider>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

describe("Navbar", () => {
  it("always shows the Code Club brand", () => {
    renderNavbar({ role: "student" });
    expect(screen.getByText("Code Club")).toBeInTheDocument();
  });

  it("shows the active theme name for a student, not a plain workspace label", () => {
    renderNavbar({ role: "student" });
    expect(screen.queryByText("Student")).not.toBeInTheDocument();
  });

  it("shows a plain Recruiter workspace label with no switcher", () => {
    renderNavbar({ role: "recruiter" });
    expect(screen.getByText("Recruiter")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /switch workspace/i })).not.toBeInTheDocument();
  });

  it("shows a plain TPO workspace label with no switcher", () => {
    renderNavbar({ role: "tpo" });
    expect(screen.getByText("TPO")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /switch workspace/i })).not.toBeInTheDocument();
  });

  it("shows the WorkspaceSwitcher for admin, defaulting to Command Center", () => {
    renderNavbar({ role: "admin" });
    expect(screen.getByRole("button", { name: /switch workspace/i })).toBeInTheDocument();
    expect(screen.getByText("Command Center")).toBeInTheDocument();
  });

  it("opens the workspace menu and lists all four workspaces", () => {
    renderNavbar({ role: "admin" });
    fireEvent.click(screen.getByRole("button", { name: /switch workspace/i }));
    expect(screen.getByRole("menu", { name: /workspaces/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: /command center/i })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByRole("menuitemradio", { name: /^student/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: /^recruiter/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: /^tpo/i })).toBeInTheDocument();
  });

  it("closes the workspace menu on Escape", () => {
    renderNavbar({ role: "admin" });
    fireEvent.click(screen.getByRole("button", { name: /switch workspace/i }));
    expect(screen.getByRole("menu", { name: /workspaces/i })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu", { name: /workspaces/i })).not.toBeInTheDocument();
  });

  it("falls back to the student nav for an unrecognized role", () => {
    renderNavbar({ role: "unknown-role" });
    expect(screen.getByText("Code Club")).toBeInTheDocument();
  });

  it("shows a search trigger for student/recruiter/tpo but not admin", () => {
    renderNavbar({ role: "student" });
    expect(screen.getAllByRole("button", { name: /search/i }).length).toBeGreaterThan(0);

    renderNavbar({ role: "admin" });
    expect(screen.queryByRole("button", { name: /^search$/i })).not.toBeInTheDocument();
  });

  it("opens the command palette from the search trigger for a student", async () => {
    renderNavbar({ role: "student" });
    fireEvent.click(screen.getAllByRole("button", { name: /search/i })[0]);
    expect(await screen.findByRole("dialog", { name: /command palette/i })).toBeInTheDocument();
  });

  it("lists role-appropriate destinations in the command palette for a recruiter", async () => {
    renderNavbar({ role: "recruiter" });
    fireEvent.click(screen.getAllByRole("button", { name: /search/i })[0]);
    expect(await screen.findByRole("button", { name: /candidates/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^problems$/i })).not.toBeInTheDocument();
  });

  it("hides the student-facing NotificationBell for admin (AttentionCenter covers it)", () => {
    renderNavbar({ role: "admin" });
    expect(screen.queryByTestId("notification-bell-stub")).not.toBeInTheDocument();
  });

  it("shows NotificationBell for student and recruiter", () => {
    renderNavbar({ role: "student" });
    expect(screen.getAllByTestId("notification-bell-stub").length).toBeGreaterThan(0);

    renderNavbar({ role: "recruiter" });
    expect(screen.getAllByTestId("notification-bell-stub").length).toBeGreaterThan(0);
  });

  it("keeps the brand block shrinkable so it never forces the mobile controls off-screen", () => {
    const { container } = renderNavbar({ role: "admin" });
    const brand = screen.getByText("Code Club").closest("div");
    expect(brand.className).toContain("min-w-0");
    expect(screen.getByText("Code Club").className).toContain("truncate");
    // The mobile controls row is the one non-brand direct sibling and must
    // stay shrink-0 so it's never the side that gets squeezed.
    const mobileControls = container.querySelector(".flex.lg\\:hidden");
    expect(mobileControls.className).toContain("shrink-0");
  });
});
