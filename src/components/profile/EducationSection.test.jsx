import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import EducationSection from "./EducationSection";

const apiFetch = vi.fn();
vi.mock("../../services/api", () => ({
  apiFetch: (...args) => apiFetch(...args),
}));

vi.mock("../../context/ThemeContext", () => ({
  useTheme: () => ({ theme: { colors: { primary: "#2dd4bf" } } }),
}));

// CollegeVerifyModal itself is covered by its own test suite — stub it out
// here so these tests are only about EducationSection's state derivation.
vi.mock("./CollegeVerifyModal", () => ({
  default: () => <div data-testid="college-verify-modal" />,
}));

describe("EducationSection — state derivation from emailVerified/collegeStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the empty state (Add College CTA) when no education data exists", async () => {
    apiFetch.mockResolvedValueOnce({ education: null });
    render(<EducationSection />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Add College" })).toBeInTheDocument());
  });

  it("renders email_pending — Resend button, not the full modal — when collegeEmail is set but not yet verified", async () => {
    apiFetch.mockResolvedValueOnce({
      education: { collegeName: "XYZ Institute", collegeEmail: "s@xyz.ac.in", emailVerified: false, collegeStatus: "unset" },
    });
    render(<EducationSection />);
    await waitFor(() => expect(screen.getByText(/Verification pending/)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Resend" })).toBeInTheDocument();
  });

  it("renders college_pending — no action button — when email is verified but institution is still under review", async () => {
    apiFetch.mockResolvedValueOnce({
      education: {
        collegeName: "XYZ Institute",
        collegeEmail: "s@xyz.ac.in",
        emailVerified: true,
        collegeStatus: "pending",
      },
    });
    render(<EducationSection />);
    await waitFor(() => expect(screen.getByText(/under review/)).toBeInTheDocument());
    expect(screen.getByText(/Email verified/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resend" })).not.toBeInTheDocument();
  });

  it("renders college_rejected with a 'Try a different college' action", async () => {
    apiFetch.mockResolvedValueOnce({
      education: {
        collegeName: "Bad Actor College",
        collegeEmail: "s@bad.com",
        emailVerified: true,
        collegeStatus: "rejected",
      },
    });
    render(<EducationSection />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Try a different college" })).toBeInTheDocument()
    );
  });

  it("renders the verified state with a Verified badge when collegeStatus is verified", async () => {
    apiFetch.mockResolvedValueOnce({
      education: {
        collegeName: "Marwadi University",
        collegeEmail: "s@marwadiuniversity.ac.in",
        emailVerified: true,
        collegeStatus: "verified",
        degree: "B.Tech",
      },
    });
    render(<EducationSection />);
    await waitFor(() => expect(screen.getByText("Verified")).toBeInTheDocument());
    expect(screen.getByText("Marwadi University")).toBeInTheDocument();
  });
});