import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExpressInterestModal } from "./RecruiterActionModals";

const apiFetch = vi.fn();
vi.mock("../../services/api", () => ({
  apiFetch: (...args) => apiFetch(...args),
}));

const toastError = vi.fn();
vi.mock("react-hot-toast", () => ({
  default: { error: (...args) => toastError(...args), success: vi.fn() },
}));

const candidate = { username: "jdoe", displayName: "Jane Doe" };

function fillNote(text = "Loved your DP solutions — we're hiring backend interns.") {
  fireEvent.change(
    screen.getByPlaceholderText(/a short note/i),
    { target: { value: text } }
  );
}

describe("ExpressInterestModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Send is disabled until a note is entered", () => {
    render(<ExpressInterestModal candidate={candidate} onClose={vi.fn()} onSent={vi.fn()} />);
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("posts to /api/recruiter/interest with the note and calls onSent + onClose on success", async () => {
    apiFetch.mockResolvedValueOnce({ interestId: "i1" });
    const onClose = vi.fn();
    const onSent = vi.fn();
    render(<ExpressInterestModal candidate={candidate} onClose={onClose} onSent={onSent} />);
    fillNote();

    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(onSent).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
    expect(apiFetch).toHaveBeenCalledWith(
      "/api/recruiter/interest",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          candidateUsername: "jdoe",
          note: "Loved your DP solutions — we're hiring backend interns.",
        }),
      })
    );
  });

  it("toasts the cooldown error and re-enables Send, instead of hanging (mirrors Plan 001's fix)", async () => {
    apiFetch.mockRejectedValueOnce(new Error("You've already reached out to this candidate recently."));
    render(<ExpressInterestModal candidate={candidate} onClose={vi.fn()} onSent={vi.fn()} />);
    fillNote();

    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("You've already reached out to this candidate recently.");
    });
    expect(screen.getByRole("button", { name: /send/i })).not.toBeDisabled();
  });
});