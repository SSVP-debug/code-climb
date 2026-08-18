import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AvatarDropdown from "./AvatarDropdown";

vi.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}));

let appContextValue = { totalXP: 0, currentStreak: 0, solvedProblems: [], role: "student" };
vi.mock("../hooks/useAppContext", () => ({
  useAppContext: () => appContextValue,
}));

vi.mock("../hooks/usePremium", () => ({
  usePremium: () => ({ monetizationEnabled: false, isPremium: false }),
}));

vi.mock("../utils/dailyChallenge", () => ({
  getDailyChallenge: () => Promise.resolve({ slug: "two-sum" }),
}));

vi.mock("../utils/recentProblem", () => ({
  getLastVisitedProblem: () => null,
}));

function openDropdown() {
  fireEvent.click(screen.getByRole("button"));
}

// Admin UX audit (Phase UI-3, P0/P1): View Profile and Pricing point at
// pages with no meaningful content for an admin account (no public
// profile identity, no premium/billing concept for internal staff), so
// they're hidden specifically for role === "admin". Settings stays for
// every role — it's genuine account-level settings, not just theming.
// Deliberately role === "admin", not the existing isStudent flag, since
// isStudent is also false for recruiter/tpo and this must not change
// their menu (UI-2's ownership, not this phase's).
describe("AvatarDropdown admin menu", () => {
  beforeEach(() => {
    appContextValue = { totalXP: 0, currentStreak: 0, solvedProblems: [], role: "student" };
  });

  it("hides View Profile and Pricing for admin, but keeps Settings", () => {
    appContextValue = { ...appContextValue, role: "admin" };
    render(<AvatarDropdown user={{ displayName: "Priya Sharma", email: "priya@codeclub.dev" }} onLogout={vi.fn()} />);
    openDropdown();

    expect(screen.queryByText("View Profile")).not.toBeInTheDocument();
    expect(screen.queryByText("Pricing")).not.toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("still shows View Profile and Pricing for a student", () => {
    render(<AvatarDropdown user={{ displayName: "Ada Lovelace", email: "ada@example.com" }} onLogout={vi.fn()} />);
    openDropdown();

    expect(screen.getByText("View Profile")).toBeInTheDocument();
    expect(screen.getByText("Pricing")).toBeInTheDocument();
  });

  it("still shows View Profile and Pricing for recruiter/tpo — unchanged by the admin audit", () => {
    appContextValue = { ...appContextValue, role: "recruiter" };
    render(<AvatarDropdown user={{ displayName: "Alex Chen", email: "alex@hiretech.io" }} onLogout={vi.fn()} />);
    openDropdown();

    expect(screen.getByText("View Profile")).toBeInTheDocument();
    expect(screen.getByText("Pricing")).toBeInTheDocument();
  });
});