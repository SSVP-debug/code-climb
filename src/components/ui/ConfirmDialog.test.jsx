import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ConfirmDialog from "./ConfirmDialog";

// Admin UX audit (Phase UI-3, P2): ConfirmDialog now gates several
// higher-stakes admin flows (suspend, role change, impersonation, reject),
// so it was brought up to the same accessibility bar as SideDrawer —
// these tests lock in that behavior.
describe("ConfirmDialog", () => {
  it("moves focus onto Cancel when it opens, not Confirm", async () => {
    render(
      <ConfirmDialog title="Delete this?" confirmLabel="Delete" destructive onConfirm={vi.fn()} onCancel={vi.fn()} />
    );

    await waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus());
  });

  it("Escape cancels when not loading", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog title="Delete this?" onConfirm={vi.fn()} onCancel={onCancel} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onCancel).toHaveBeenCalled();
  });

  it("Escape does nothing while a request is in flight", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog title="Delete this?" onConfirm={vi.fn()} onCancel={onCancel} loading />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onCancel).not.toHaveBeenCalled();
  });

  it("clicking the backdrop does nothing while loading", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog title="Delete this?" onConfirm={vi.fn()} onCancel={onCancel} loading />);

    fireEvent.click(screen.getByRole("presentation"));

    expect(onCancel).not.toHaveBeenCalled();
  });

  it("clicking the backdrop cancels when not loading", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog title="Delete this?" onConfirm={vi.fn()} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("presentation"));

    expect(onCancel).toHaveBeenCalled();
  });

  it("restores focus to the element that triggered it on close", async () => {
    const trigger = document.createElement("button");
    trigger.textContent = "open dialog";
    document.body.appendChild(trigger);
    trigger.focus();
    expect(trigger).toHaveFocus();

    const { unmount } = render(
      <ConfirmDialog title="Delete this?" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    await waitFor(() => expect(trigger).not.toHaveFocus());

    unmount();
    expect(trigger).toHaveFocus();

    document.body.removeChild(trigger);
  });
});