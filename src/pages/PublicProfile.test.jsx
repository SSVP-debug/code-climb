import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider } from "../context/ThemeContext";
import PublicProfile from "./PublicProfile";

vi.mock("react-router-dom", () => ({
  useParams: () => ({ username: "opencandidate" }),
}));

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

const apiFetch = vi.fn();
vi.mock("../services/api", () => ({
  apiFetch: (...args) => apiFetch(...args),
}));

let appContextValue;
vi.mock("../hooks/useAppContext", () => ({
  useAppContext: () => appContextValue,
}));

const BASE_PROFILE = {
  username: "opencandidate",
  displayName: "Open Candidate",
  level: 12,
  totalXP: 4200,
  solvedCount: 80,
  currentStreak: 5,
  longestStreak: 20,
  joinedDate: "2025-01-01T00:00:00.000Z",
  achievements: [],
  topicStats: {},
  activityDates: [],
};

function mockProfileFetch(overrides = {}) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ...BASE_PROFILE, ...overrides }),
  });
}

function renderProfile() {
  return render(
    <ThemeProvider>
      <PublicProfile />
    </ThemeProvider>
  );
}

describe("PublicProfile — recruiter action bar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiFetch.mockResolvedValue({});
  });

  it("does not show recruiter actions to an anonymous/student visitor", async () => {
    appContextValue = { role: "student", isBackendReady: true };
    mockProfileFetch();
    renderProfile();

    await waitFor(() => screen.getByText("Open Candidate"));
    expect(screen.queryByText("Viewing as recruiter")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /send skills test/i })).not.toBeInTheDocument();
  });

  it("does not show recruiter actions before the backend role has hydrated, even if role will end up recruiter", async () => {
    appContextValue = { role: "student", isBackendReady: false };
    mockProfileFetch();
    renderProfile();

    await waitFor(() => screen.getByText("Open Candidate"));
    expect(screen.queryByText("Viewing as recruiter")).not.toBeInTheDocument();
  });

  it("shows recruiter actions once the visitor is a hydrated recruiter", async () => {
    appContextValue = { role: "recruiter", isBackendReady: true };
    mockProfileFetch();
    renderProfile();

    await waitFor(() => screen.getByText("Viewing as recruiter"));
    expect(screen.getByRole("button", { name: /express interest/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send skills test/i })).toBeInTheDocument();
  });

  it("opens the Send Skills Test modal addressed to the profile being viewed", async () => {
    appContextValue = { role: "recruiter", isBackendReady: true };
    mockProfileFetch();
    renderProfile();

    await waitFor(() => screen.getByText("Viewing as recruiter"));
    fireEvent.click(screen.getByRole("button", { name: /send skills test/i }));

    expect(screen.getByRole("heading", { name: "Send Skills Test" })).toBeInTheDocument();
    expect(screen.getByText("To: Open Candidate (opencandidate)")).toBeInTheDocument();
  });

  it("opens the Express Interest modal addressed to the profile being viewed", async () => {
    appContextValue = { role: "recruiter", isBackendReady: true };
    mockProfileFetch();
    renderProfile();

    await waitFor(() => screen.getByText("Viewing as recruiter"));
    fireEvent.click(screen.getByRole("button", { name: /express interest/i }));

    expect(screen.getByRole("heading", { name: "Express Interest" })).toBeInTheDocument();
    expect(screen.getByText("To: Open Candidate (opencandidate)")).toBeInTheDocument();
  });
});