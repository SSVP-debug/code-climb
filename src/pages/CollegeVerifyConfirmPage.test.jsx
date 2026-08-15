import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import CollegeVerifyConfirmPage from "./CollegeVerifyConfirmPage";

const apiFetch = vi.fn();
vi.mock("../services/api", () => ({
  apiFetch: (...args) => apiFetch(...args),
}));

vi.mock("../hooks/useTheme", () => ({
  useTheme: () => ({ theme: { colors: { primary: "#2dd4bf" } } }),
}));

vi.mock("../layouts/DashboardLayout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

let searchParamsValue = new URLSearchParams({ token: "tok" });
vi.mock("react-router-dom", () => ({
  useSearchParams: () => [searchParamsValue],
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

describe("CollegeVerifyConfirmPage — copy branches on collegeStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsValue = new URLSearchParams({ token: "tok" });
  });

  it("shows 'College Verified' + leaderboard CTA when collegeStatus is verified", async () => {
    apiFetch.mockResolvedValueOnce({ collegeName: "Marwadi University", collegeStatus: "verified" });
    render(<CollegeVerifyConfirmPage />);

    await waitFor(() => expect(screen.getByText("College Verified")).toBeInTheDocument());
    expect(screen.getByText(/is now linked to your account/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View College Leaderboard" })).toHaveAttribute(
      "href",
      "/club/leaderboard"
    );
  });

  it("shows 'Email Verified' + pending copy (not 'unlocked') when collegeStatus is pending — regression test for the old unconditional copy bug", async () => {
    apiFetch.mockResolvedValueOnce({ collegeName: "XYZ Institute", collegeStatus: "pending" });
    render(<CollegeVerifyConfirmPage />);

    await waitFor(() => expect(screen.getByText("Email Verified")).toBeInTheDocument());
    expect(screen.getByText(/now under review/)).toBeInTheDocument();
    expect(screen.queryByText(/Leaderboard is unlocked/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Profile" })).toHaveAttribute("href", "/profile");
  });

  it("shows the error state with a link back to Profile when the token is invalid", async () => {
    apiFetch.mockRejectedValueOnce(new Error("Invalid or expired verification link."));
    render(<CollegeVerifyConfirmPage />);

    await waitFor(() => expect(screen.getByText("Verification Failed")).toBeInTheDocument());
    expect(screen.getByText("Invalid or expired verification link.")).toBeInTheDocument();
  });
});