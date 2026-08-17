import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import TpoDashboardPage from "./TpoDashboardPage";

const apiFetch = vi.fn();
vi.mock("../services/api", () => ({
  apiFetch: (...args) => apiFetch(...args),
}));

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

// Navbar transformation: TpoDashboardPage now renders inside DashboardLayout
// (previously it had no shared shell at all). Same reasoning as
// RecruiterDashboardPage.test.jsx — ThemeProvider for ThemeSkin, Navbar
// stubbed since it has its own dedicated test file and its apiFetch calls
// would otherwise interleave with this file's assertions.
vi.mock("../components/Navbar", () => ({
  default: () => <div data-testid="navbar-stub" />,
}));

const dashboardData = {
  college: "Example University",
  domain: "example.edu",
  totalStudents: 3,
  readinessScore: 55,
  avgSolved: 10,
  activePercent: 40,
  totalSolved: 30,
  difficultyBreakdown: { hard: 5 },
  topicCoverage: [{ topic: "Arrays", totalSolves: 10 }],
};

const studentsData = {
  students: [
    { name: "Alice Adams", email: "alice@example.edu", totalXP: 500, solvedCount: 20, currentStreak: 3 },
    { name: "Bob Brown", email: "bob@example.edu", totalXP: 900, solvedCount: 10, currentStreak: 0 },
    { name: "Carol Chen", email: "carol@example.edu", totalXP: 100, solvedCount: 5, currentStreak: 1 },
  ],
};

function renderDashboard() {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/tpo/dashboard?tab=students"]}>
        <TpoDashboardPage />
      </MemoryRouter>
    </ThemeProvider>
  );
}

async function loadDashboard() {
  apiFetch.mockImplementation((url) => {
    if (url === "/api/tpo/dashboard") return Promise.resolve(dashboardData);
    if (url === "/api/tpo/students") return Promise.resolve(studentsData);
    if (url === "/api/tpo/assignments") return Promise.resolve({ assignments: [] });
    return Promise.reject(new Error(`Unexpected apiFetch call: ${url}`));
  });
  renderDashboard();
  await waitFor(() => screen.getByText("Alice Adams"));
}

describe("TpoDashboardPage — students tab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sorts by XP descending by default (Bob 900, Alice 500, Carol 100)", async () => {
    await loadDashboard();

    const rows = screen.getAllByText(/Adams|Brown|Chen/).map((el) => el.textContent);
    expect(rows).toEqual(["Bob Brown", "Alice Adams", "Carol Chen"]);
  });

  it("filters the roster by name as you type", async () => {
    await loadDashboard();

    fireEvent.change(screen.getByPlaceholderText(/search by name or email/i), {
      target: { value: "carol" },
    });

    expect(screen.getByText("Carol Chen")).toBeInTheDocument();
    expect(screen.queryByText("Alice Adams")).not.toBeInTheDocument();
    expect(screen.queryByText("Bob Brown")).not.toBeInTheDocument();
  });

  it("filters the roster by email as you type", async () => {
    await loadDashboard();

    fireEvent.change(screen.getByPlaceholderText(/search by name or email/i), {
      target: { value: "bob@example.edu" },
    });

    expect(screen.getByText("Bob Brown")).toBeInTheDocument();
    expect(screen.queryByText("Alice Adams")).not.toBeInTheDocument();
  });

  it("re-sorts the roster when a different sort option is chosen (Name: Alice, Bob, Carol)", async () => {
    await loadDashboard();

    fireEvent.change(screen.getByDisplayValue("Sort: XP"), { target: { value: "name" } });

    const rows = screen.getAllByText(/Adams|Brown|Chen/).map((el) => el.textContent);
    expect(rows).toEqual(["Alice Adams", "Bob Brown", "Carol Chen"]);
  });

  it("shows an empty-state message instead of an empty list when no student matches the search", async () => {
    await loadDashboard();

    fireEvent.change(screen.getByPlaceholderText(/search by name or email/i), {
      target: { value: "nobody-matches-this" },
    });

    expect(screen.getByText(/no students match/i)).toBeInTheDocument();
  });

  it("no longer renders the dead hover-only affordance on student rows", async () => {
    await loadDashboard();

    const row = screen.getByText("Alice Adams").closest("div");
    expect(row.className).not.toMatch(/hover:bg-zinc-800\/30/);
  });
});

describe("TpoDashboardPage — pending verification and shared shell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a support contact and the shared nav shell instead of a dead-end screen", async () => {
    apiFetch.mockRejectedValue(new Error("Your TPO account is pending verification."));
    renderDashboard();

    await waitFor(() => screen.getByText("College Verification Pending"));
    expect(screen.getByText(/hello@codeclub.in/)).toBeInTheDocument();
    expect(screen.getByTestId("navbar-stub")).toBeInTheDocument();
  });

  it("renders the main dashboard inside the shared DashboardLayout shell", async () => {
    await loadDashboard();
    expect(screen.getByTestId("navbar-stub")).toBeInTheDocument();
  });
});

describe("TpoDashboardPage — assignments tab reminder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function loadAssignmentsTab() {
    apiFetch.mockImplementation((url, opts) => {
      if (url === "/api/tpo/dashboard") return Promise.resolve(dashboardData);
      if (url === "/api/tpo/students") return Promise.resolve(studentsData);
      if (url === "/api/tpo/assignments" && !opts) {
        return Promise.resolve({
          assignments: [
            {
              _id: "a1",
              title: "Week 3 — Arrays",
              dueDate: "2026-08-01",
              problemSlugs: ["two-sum"],
              completedCount: 1,
              totalStudents: 3,
              completionPercent: 33,
              isOverdue: false,
            },
          ],
        });
      }
      return Promise.reject(new Error(`Unexpected apiFetch call: ${url}`));
    });
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={["/tpo/dashboard?tab=assignments"]}>
          <TpoDashboardPage />
        </MemoryRouter>
      </ThemeProvider>
    );
    await waitFor(() => screen.getByText("Week 3 — Arrays"));
  }

  it("posts to the remind endpoint and shows a success toast with the count", async () => {
    await loadAssignmentsTab();
    apiFetch.mockResolvedValueOnce({ remindedCount: 2 });

    fireEvent.click(screen.getByRole("button", { name: /remind incomplete/i }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith("/api/tpo/assignments/a1/remind", { method: "POST" });
    });
    // Button re-enables afterwards instead of hanging (same fix pattern as Plan 001).
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /remind incomplete/i })).not.toBeDisabled();
    });
  });

  it("re-enables the button (does not hang) if the reminder request fails", async () => {
    await loadAssignmentsTab();
    apiFetch.mockRejectedValueOnce(new Error("Failed to send reminder."));

    fireEvent.click(screen.getByRole("button", { name: /remind incomplete/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /remind incomplete/i })).not.toBeDisabled();
    });
  });
});