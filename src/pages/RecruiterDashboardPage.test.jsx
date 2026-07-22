import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RecruiterDashboardPage from "./RecruiterDashboardPage";

const apiFetch = vi.fn();
vi.mock("../services/api", () => ({
  apiFetch: (...args) => apiFetch(...args),
}));

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/recruiter/dashboard"]}>
      <RecruiterDashboardPage />
    </MemoryRouter>
  );
}

function lastQueryString() {
  const url = apiFetch.mock.calls[apiFetch.mock.calls.length - 1][0];
  return new URLSearchParams(url.split("?")[1] || "");
}

describe("RecruiterDashboardPage filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiFetch.mockResolvedValue({ candidates: [], total: 0 });
  });

  it("does not include preferredRole/availableForWork on the initial load (both unset)", async () => {
    renderPage();
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());

    const q = lastQueryString();
    expect(q.has("preferredRole")).toBe(false);
    expect(q.has("availableForWork")).toBe(false);
  });

  it("includes preferredRole in the query once selected and Search is clicked", async () => {
    renderPage();
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());

    fireEvent.change(screen.getByDisplayValue("Any role"), { target: { value: "Backend" } });
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() => {
      expect(lastQueryString().get("preferredRole")).toBe("Backend");
    });
  });

  it("includes availableForWork=true once the checkbox is checked and Search is clicked", async () => {
    renderPage();
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());

    fireEvent.click(screen.getByLabelText(/available now/i));
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() => {
      expect(lastQueryString().get("availableForWork")).toBe("true");
    });
  });
});

describe("RecruiterDashboardPage verified badge explanation", () => {
  const verifiedCandidate = {
    username: "vcandidate",
    displayName: "Verified Candidate",
    college: "Example University",
    topTopics: [],
    solvedCount: 42,
    hard: 5,
    isVerified: true,
  };
  const unverifiedCandidate = {
    username: "ucandidate",
    displayName: "Unverified Candidate",
    college: "Example University",
    topTopics: [],
    solvedCount: 10,
    hard: 1,
    isVerified: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    apiFetch.mockResolvedValue({ candidates: [verifiedCandidate, unverifiedCandidate], total: 2 });
  });

  it("shows the header info button and reveals an explanation on hover", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Verified Candidate"));

    const infoButton = screen.getByLabelText("What does verified mean?");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    fireEvent.mouseEnter(infoButton.closest("span"));

    expect(screen.getByRole("tooltip")).toHaveTextContent(/cryptographically signed/i);
  });

  it("hides the tooltip again on mouse leave", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Verified Candidate"));

    const wrapper = screen.getByLabelText("What does verified mean?").closest("span");
    fireEvent.mouseEnter(wrapper);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("gives a verified candidate row a title explaining the cryptographic signature", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Verified Candidate"));

    const verifiedRow = screen.getByText("Verified Candidate").closest("div.grid");
    const badgeCell = verifiedRow.querySelector("[title]");
    expect(badgeCell.getAttribute("title")).toMatch(/cryptographically signed/i);
  });

  it("gives an unverified candidate row a title explaining the profile hasn't been signed", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Unverified Candidate"));

    const unverifiedRow = screen.getByText("Unverified Candidate").closest("div.grid");
    const badgeCell = unverifiedRow.querySelector("[title]");
    expect(badgeCell.getAttribute("title")).toBe("Profile has not been signed yet.");
  });
});