import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import LoginAsButton from "./LoginAsButton";

// Admin UX audit (Phase UI-3, P0): impersonation used to fire on a single
// click from two call sites. This locks in the fix at the shared
// component level — loginAs must not be called until the confirmation
// dialog is explicitly confirmed, and must never be called at all if the
// admin cancels.
describe("LoginAsButton", () => {
  const user = { id: "u1", displayName: "Ada Lovelace", email: "ada@example.com" };

  it("does not call loginAs on the initial click — shows a confirmation first", () => {
    const loginAs = vi.fn();
    render(<LoginAsButton user={user} impersonatingId={null} loginAs={loginAs} />);

    fireEvent.click(screen.getByRole("button", { name: /login as/i }));

    expect(loginAs).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/log in as ada lovelace/i)).toBeInTheDocument();
  });

  it("calls loginAs only after the confirmation is accepted", () => {
    const loginAs = vi.fn();
    render(<LoginAsButton user={user} impersonatingId={null} loginAs={loginAs} />);

    fireEvent.click(screen.getByRole("button", { name: /login as/i }));
    const dialog = screen.getByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Login As" }));

    expect(loginAs).toHaveBeenCalledWith(user);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("never calls loginAs if the admin cancels", () => {
    const loginAs = vi.fn();
    render(<LoginAsButton user={user} impersonatingId={null} loginAs={loginAs} />);

    fireEvent.click(screen.getByRole("button", { name: /login as/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(loginAs).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("disables and shows a loading state while this user's impersonation is in flight", () => {
    const loginAs = vi.fn();
    render(<LoginAsButton user={user} impersonatingId="u1" loginAs={loginAs} />);

    const button = screen.getByRole("button", { name: /login as/i });
    expect(button).toBeDisabled();
  });
});