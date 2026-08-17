import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import UserActionsMenu from "./UserActionsMenu";

function renderMenu(overrides = {}) {
  const user = { id: "u1", displayName: "Grace Hopper", email: "grace@example.com", role: "student", status: "active" };
  const handlers = {
    onSuspend: vi.fn(),
    onActivate: vi.fn(),
    onDelete: vi.fn(),
    onResetProgress: vi.fn(),
    onChangeRole: vi.fn(),
  };
  render(<UserActionsMenu user={user} busy={undefined} {...handlers} {...overrides} />);
  return handlers;
}

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: /user actions/i }));
}

// Admin UX audit (Phase UI-3, P0): suspend and change-role previously
// fired immediately from the dropdown. These tests lock in that both now
// require confirmation, matching the existing delete/reset-progress
// behavior, while activate (the low-risk, restorative direction) stays
// single-click.
describe("UserActionsMenu", () => {
  it("does not suspend until the confirmation is accepted", () => {
    const handlers = renderMenu();
    openMenu();
    fireEvent.click(screen.getByRole("button", { name: /suspend/i }));

    expect(handlers.onSuspend).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Suspend" }));
    expect(handlers.onSuspend).toHaveBeenCalledWith("u1");
  });

  it("cancelling the suspend confirmation never calls onSuspend", () => {
    const handlers = renderMenu();
    openMenu();
    fireEvent.click(screen.getByRole("button", { name: /suspend/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(handlers.onSuspend).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("does not change role until the confirmation is accepted", () => {
    const handlers = renderMenu();
    openMenu();
    fireEvent.click(screen.getByRole("button", { name: /change role/i }));
    fireEvent.click(screen.getByText("→ recruiter"));

    expect(handlers.onChangeRole).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/change role to recruiter/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Change role" }));
    expect(handlers.onChangeRole).toHaveBeenCalledWith("u1", "recruiter");
  });

  it("never offers 'admin' as a role change target", () => {
    renderMenu();
    openMenu();
    fireEvent.click(screen.getByRole("button", { name: /change role/i }));

    expect(screen.queryByText("→ admin")).not.toBeInTheDocument();
  });

  it("activate stays single-click with no confirmation", () => {
    const handlers = renderMenu({ user: { id: "u1", displayName: "Grace Hopper", email: "grace@example.com", role: "student", status: "suspended" } });
    openMenu();
    fireEvent.click(screen.getByRole("button", { name: /activate/i }));

    expect(handlers.onActivate).toHaveBeenCalledWith("u1");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});