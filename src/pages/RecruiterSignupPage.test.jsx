import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RecruiterSignupPage from "./RecruiterSignupPage";

const navigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
}));

const apiFetch = vi.fn();
vi.mock("../services/api", () => ({
  apiFetch: (...args) => apiFetch(...args),
}));

function fillForm() {
  fireEvent.change(screen.getByPlaceholderText("e.g. Google"), {
    target: { value: "Acme Corp" },
  });
  fireEvent.change(screen.getByPlaceholderText("e.g. Technical Recruiter"), {
    target: { value: "Recruiter" },
  });
}

function submitButton() {
  return screen.getByRole("button", { name: /activate recruiter access|setting up/i });
}

describe("RecruiterSignupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the error and re-enables the button when registration fails, instead of spinning forever", async () => {
    apiFetch.mockRejectedValueOnce(new Error("Duplicate account"));
    render(<RecruiterSignupPage />);
    fillForm();

    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(screen.getByText("Duplicate account")).toBeInTheDocument();
    });
    expect(navigate).not.toHaveBeenCalled();
    // The historical bug: setLoading(false) never ran, so the button stayed
    // disabled forever. Assert it's usable again.
    expect(submitButton()).not.toBeDisabled();
    expect(screen.getByText("Activate Recruiter Access")).toBeInTheDocument();
  });

  it("falls back to a generic message if the thrown error has no message", async () => {
    apiFetch.mockRejectedValueOnce(new Error());
    render(<RecruiterSignupPage />);
    fillForm();

    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(screen.getByText("Something went wrong. Try again.")).toBeInTheDocument();
    });
  });

  it("navigates to the recruiter dashboard on success", async () => {
    apiFetch.mockResolvedValueOnce({});
    render(<RecruiterSignupPage />);
    fillForm();

    fireEvent.click(submitButton());

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/recruiter/dashboard");
    });
    expect(screen.queryByText(/duplicate|something went wrong/i)).not.toBeInTheDocument();
  });
});