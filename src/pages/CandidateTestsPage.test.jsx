import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider } from "../context/ThemeContext";
import CandidateTestsPage from "./CandidateTestsPage";

const navigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => navigate,
}));

const apiFetch = vi.fn();
vi.mock("../services/api", () => ({
  apiFetch: (...args) => apiFetch(...args),
}));

const toastError = vi.fn();
vi.mock("react-hot-toast", () => ({
  default: { error: (...args) => toastError(...args), success: vi.fn() },
}));

// Navbar transformation: CandidateTestsPage now renders inside
// DashboardLayout (previously it had no shared shell at all). This file
// mocks react-router-dom down to just useNavigate, which would break
// Navbar's own Link/useLocation usage — stub it out (it has its own
// dedicated test file) and wrap in ThemeProvider for ThemeSkin.
vi.mock("../components/Navbar", () => ({
  default: () => <div data-testid="navbar-stub" />,
}));

function renderPage(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

const pendingTest = {
  _id: "t1",
  status: "pending",
  problemSlugs: ["two-sum"],
  durationMs: 90 * 60 * 1000,
  recruiterCompany: "Acme Corp",
  note: null,
};

describe("CandidateTestsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an error state (not an infinite spinner) when the initial load fails", async () => {
    apiFetch.mockRejectedValueOnce(new Error("Network error"));
    renderPage(<CandidateTestsPage />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
    // The historical bug: loading never got set back to false, so the
    // spinner (and only the spinner) rendered forever.
    expect(document.querySelector(".animate-spin")).not.toBeInTheDocument();
  });

  it("falls back to a generic load-error message if the thrown error has no message", async () => {
    apiFetch.mockRejectedValueOnce(new Error());
    renderPage(<CandidateTestsPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load your tests.")).toBeInTheDocument();
    });
  });

  it("renders tests normally when the load succeeds", async () => {
    apiFetch.mockResolvedValueOnce({ tests: [pendingTest] });
    renderPage(<CandidateTestsPage />);

    await waitFor(() => {
      expect(screen.getByText("Acme Corp Skills Test")).toBeInTheDocument();
    });
  });

  it("shows a toast and re-enables the row's button when starting a test fails", async () => {
    apiFetch.mockResolvedValueOnce({ tests: [pendingTest] });
    renderPage(<CandidateTestsPage />);
    await waitFor(() => screen.getByText("Acme Corp Skills Test"));

    apiFetch.mockRejectedValueOnce(new Error("Test already started"));
    fireEvent.click(screen.getByRole("button", { name: /start test/i }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith("Test already started");
    });
    expect(navigate).not.toHaveBeenCalled();
    // The historical bug: `starting` never got reset, so the button stayed
    // disabled/stuck on "Starting…" forever.
    expect(screen.getByRole("button", { name: /start test/i })).not.toBeDisabled();
  });

  it("navigates to the test on a successful start", async () => {
    apiFetch.mockResolvedValueOnce({ tests: [pendingTest] });
    renderPage(<CandidateTestsPage />);
    await waitFor(() => screen.getByText("Acme Corp Skills Test"));

    apiFetch.mockResolvedValueOnce({});
    fireEvent.click(screen.getByRole("button", { name: /start test/i }));

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/candidate/tests/t1");
    });
  });
});