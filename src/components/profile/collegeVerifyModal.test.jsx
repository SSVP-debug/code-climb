import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CollegeVerifyModal from "./CollegeVerifyModal";

const apiFetch = vi.fn();
vi.mock("../../services/api", () => ({
  apiFetch: (...args) => apiFetch(...args),
}));

vi.mock("../../hooks/useTheme", () => ({
  useTheme: () => ({ theme: { colors: { primary: "#2dd4bf" } } }),
}));

function fillEmail(value) {
  fireEvent.change(screen.getByPlaceholderText("you@college.ac.in"), { target: { value } });
}

describe("CollegeVerifyModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("goes straight to the email_sent step for a recognized domain — no toast, no dead end", async () => {
    apiFetch.mockResolvedValueOnce({ success: true, emailSent: true, collegeRecognized: true });
    render(<CollegeVerifyModal onClose={vi.fn()} onSent={vi.fn()} />);

    fillEmail("student@marwadiuniversity.ac.in");
    fireEvent.click(screen.getByRole("button", { name: /verify college email/i }));

    await waitFor(() => {
      expect(screen.getByText("Check your college inbox")).toBeInTheDocument();
    });
    expect(screen.queryByText("Your college is also being reviewed for the College Leaderboard.")).not.toBeInTheDocument();
  });

  it("transitions to the unknown_college step (not an error toast) when the domain isn't recognized", async () => {
    const err = new Error("College name is required for an unrecognized domain.");
    err.body = { code: "COLLEGE_NAME_REQUIRED" };
    apiFetch.mockRejectedValueOnce(err);
    render(<CollegeVerifyModal onClose={vi.fn()} onSent={vi.fn()} />);

    fillEmail("student@xyzcollege.ac.in");
    fireEvent.click(screen.getByRole("button", { name: /verify college email/i }));

    await waitFor(() => {
      expect(screen.getByText("We haven't added your college yet")).toBeInTheDocument();
    });
    expect(screen.getByText(/xyzcollege\.ac\.in/)).toBeInTheDocument();
    // This is the core regression test: an unrecognized domain must never
    // produce an unactionable dead-end error state.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("completes the unknown_college step and shows the pending-review note", async () => {
    const err = new Error("College name is required for an unrecognized domain.");
    err.body = { code: "COLLEGE_NAME_REQUIRED" };
    apiFetch.mockRejectedValueOnce(err);
    apiFetch.mockResolvedValueOnce({
      success: true,
      emailSent: true,
      collegeRecognized: false,
      collegeName: "XYZ Institute of Technology",
    });

    render(<CollegeVerifyModal onClose={vi.fn()} onSent={vi.fn()} />);
    fillEmail("student@xyzcollege.ac.in");
    fireEvent.click(screen.getByRole("button", { name: /verify college email/i }));
    await waitFor(() => screen.getByText("We haven't added your college yet"));

    fireEvent.change(screen.getByPlaceholderText("College name"), {
      target: { value: "XYZ Institute of Technology" },
    });
    fireEvent.click(screen.getByRole("button", { name: /request & verify email/i }));

    await waitFor(() => {
      expect(screen.getByText("Check your college inbox")).toBeInTheDocument();
    });
    expect(screen.getByText("Your college is also being reviewed for the College Leaderboard.")).toBeInTheDocument();
  });

  it("shows an inline role=alert error (not a toast) on a genuine failure, and lets the user retry", async () => {
    apiFetch.mockRejectedValueOnce(new Error("Network error — please try again."));
    render(<CollegeVerifyModal onClose={vi.fn()} onSent={vi.fn()} />);

    fillEmail("student@marwadiuniversity.ac.in");
    fireEvent.click(screen.getByRole("button", { name: /verify college email/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Network error — please try again.");
    });
    // Still on the initial step — not dead-ended, can retry.
    expect(screen.getByRole("button", { name: /verify college email/i })).not.toBeDisabled();
  });
});