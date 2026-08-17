import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import RecruiterDashboardPage from "./RecruiterDashboardPage";

const apiFetch = vi.fn();
vi.mock("../services/api", () => ({
  apiFetch: (...args) => apiFetch(...args),
}));

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

// Navbar transformation: RecruiterDashboardPage now renders inside
// DashboardLayout (previously it had no shared shell at all). DashboardLayout
// wraps children in ThemeSkin (needs ThemeProvider) and renders the full
// Navbar — stubbed here, same reasoning Navbar.test.jsx and
// AdminLayout.test.jsx already give: Navbar's own apiFetch calls
// (NotificationBell, AvatarDropdown's premium check) would otherwise
// interleave with this file's apiFetch assertions and it has its own
// dedicated test file already.
vi.mock("../components/Navbar", () => ({
  default: () => <div data-testid="navbar-stub" />,
}));

function renderPage() {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/recruiter/dashboard"]}>
        <RecruiterDashboardPage />
      </MemoryRouter>
    </ThemeProvider>
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

  it("includes expectedGraduation in the query once a grad year is selected and Search is clicked", async () => {
    renderPage();
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());

    const nextYear = String(new Date().getFullYear() + 1);
    fireEvent.change(screen.getByDisplayValue("Any grad year"), { target: { value: nextYear } });
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() => {
      expect(lastQueryString().get("expectedGraduation")).toBe(nextYear);
    });
  });

  it("renders inside the shared DashboardLayout shell", async () => {
    renderPage();
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());
    expect(screen.getByTestId("navbar-stub")).toBeInTheDocument();
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

describe("RecruiterDashboardPage candidate row badges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an Open to work badge and grad year for a candidate who set them", async () => {
    apiFetch.mockResolvedValue({
      candidates: [{
        username: "opencandidate",
        displayName: "Open Candidate",
        college: "Example University",
        topTopics: [],
        solvedCount: 12,
        hard: 2,
        isVerified: false,
        availableForWork: true,
        expectedGraduation: "2026",
      }],
      total: 1,
    });
    renderPage();
    await waitFor(() => screen.getByText("Open Candidate"));

    const row = within(screen.getByText("Open Candidate").closest("div.grid"));
    expect(row.getByText("Open to work")).toBeInTheDocument();
    expect(row.getByText("Grad 2026")).toBeInTheDocument();
  });

  it("omits the badges for a candidate who hasn't set them", async () => {
    apiFetch.mockResolvedValue({
      candidates: [{
        username: "quietcandidate",
        displayName: "Quiet Candidate",
        college: "Example University",
        topTopics: [],
        solvedCount: 8,
        hard: 1,
        isVerified: false,
      }],
      total: 1,
    });
    renderPage();
    await waitFor(() => screen.getByText("Quiet Candidate"));

    const row = within(screen.getByText("Quiet Candidate").closest("div.grid"));
    expect(row.queryByText("Open to work")).not.toBeInTheDocument();
    expect(row.queryByText(/^Grad /)).not.toBeInTheDocument();
  });
});

describe("RecruiterDashboardPage pending verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a support contact and the shared nav shell instead of a dead-end screen", async () => {
    apiFetch.mockRejectedValue(new Error("Your recruiter account is pending verification."));
    renderPage();

    await waitFor(() => screen.getByText("Recruiter Verification Pending"));
    expect(screen.getByText(/hello@codeclub.in/)).toBeInTheDocument();
    expect(screen.getByTestId("navbar-stub")).toBeInTheDocument();
  });
});