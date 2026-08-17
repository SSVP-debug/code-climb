import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import UsersLoginAsSection from "./UsersLoginAsSection";

// UsersLoginAsSection renders useAdminDashboardMetrics internally (for the
// "pending verification" chip) — mock apiFetch so that hook's fetch-on-mount
// doesn't hit the network or cause unrelated act() warnings in this file's
// tests, which are only exercising the search box.
vi.mock("../../services/api", () => ({
  apiFetch: vi.fn(() => Promise.resolve({})),
}));

// Admin UX audit (Phase UI-3, P1): search box previously had no way to
// clear typed text except backspacing it out. Locks in the new × button.
function renderSection(overrides = {}) {
  const setSearchInput = vi.fn();
  const adminUsers = {
    users: [],
    usersTotal: 0,
    usersLoading: false,
    usersPage: 1,
    setUsersPage: vi.fn(),
    roleFilter: "",
    setRoleFilter: vi.fn(),
    searchInput: "ada",
    setSearchInput,
    collegeFilter: null,
    collegeName: null,
    clearCollegeFilter: vi.fn(),
    impersonatingId: null,
    loginAs: vi.fn(),
    busyIds: {},
    suspendUser: vi.fn(),
    activateUser: vi.fn(),
    deleteUser: vi.fn(),
    resetUserProgress: vi.fn(),
    changeUserRole: vi.fn(),
    ...overrides,
  };
  render(<UsersLoginAsSection adminUsers={adminUsers} />);
  return { setSearchInput };
}

describe("UsersLoginAsSection search", () => {
  it("shows a clear button when there is search text, and clears it on click", () => {
    const { setSearchInput } = renderSection();

    const clearButton = screen.getByRole("button", { name: /clear search/i });
    fireEvent.click(clearButton);

    expect(setSearchInput).toHaveBeenCalledWith("");
  });

  it("hides the clear button when the search box is empty", () => {
    renderSection({ searchInput: "" });

    expect(screen.queryByRole("button", { name: /clear search/i })).not.toBeInTheDocument();
  });
});