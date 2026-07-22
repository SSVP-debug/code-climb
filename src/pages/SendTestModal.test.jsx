import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SendTestModal } from "./RecruiterDashboardPage";

const apiFetch = vi.fn();
vi.mock("../services/api", () => ({
  apiFetch: (...args) => apiFetch(...args),
}));

const toastError = vi.fn();
vi.mock("react-hot-toast", () => ({
  default: { error: (...args) => toastError(...args), success: vi.fn() },
}));

const candidate = { username: "jdoe", displayName: "Jane Doe" };

function fillSlugs() {
  fireEvent.change(
    screen.getByPlaceholderText("Problem slugs, comma-separated (e.g. two-sum, valid-parentheses)"),
    { target: { value: "two-sum" } }
  );
}

describe("SendTestModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("toasts the error and re-enables Send when the request fails, instead of hanging", async () => {
    apiFetch.mockRejectedValueOnce(new Error("Candidate not found"));
    const onClose = vi.fn();
    const onSent = vi.fn();
    render(<SendTestModal candidate={candidate} onClose={onClose} onSent={onSent} />);
    fillSlugs();

    fireEvent.click(screen.getByRole("button", { name: /send test/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("Candidate not found");
    });
    expect(onSent).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    // The historical bug: setLoading(false) never ran, so the button stayed
    // disabled/stuck on its loading state forever.
    expect(screen.getByRole("button", { name: /send test/i })).not.toBeDisabled();
  });

  it("calls onSent and onClose when the request succeeds", async () => {
    apiFetch.mockResolvedValueOnce({});
    const onClose = vi.fn();
    const onSent = vi.fn();
    render(<SendTestModal candidate={candidate} onClose={onClose} onSent={onSent} />);
    fillSlugs();

    fireEvent.click(screen.getByRole("button", { name: /send test/i }));

    await waitFor(() => {
      expect(onSent).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
    expect(toastError).not.toHaveBeenCalled();
  });
});