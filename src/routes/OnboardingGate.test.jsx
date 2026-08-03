import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import OnboardingGate from "./OnboardingGate";

const navigateMock = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("../layouts/DashboardLayout", () => ({
  default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}));

// Real DailyQuickQuiz selects random questions and runs timers — irrelevant
// to this gate's own logic (once-per-day gating + role redirect), which is
// what this file tests. Stub it down to just its `onComplete` contract.
vi.mock("../components/onboarding/DailyQuickQuiz", () => ({
  default: ({ onComplete }) => (
    <button onClick={onComplete}>finish quiz</button>
  ),
}));

let appContextValue = { role: "student" };
vi.mock("../hooks/useAppContext", () => ({
  useAppContext: () => appContextValue,
}));

const hasCompletedQuizTodayMock = vi.fn();
const markQuizCompletedTodayMock = vi.fn();
vi.mock("../utils/dailyQuizStorage", () => ({
  hasCompletedQuizToday: () => hasCompletedQuizTodayMock(),
  markQuizCompletedToday: () => markQuizCompletedTodayMock(),
}));

describe("OnboardingGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appContextValue = { role: "student" };
  });

  it("renders children directly when the quiz was already completed today", () => {
    hasCompletedQuizTodayMock.mockReturnValue(true);

    render(
      <OnboardingGate>
        <div>Dashboard content</div>
      </OnboardingGate>
    );

    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(screen.queryByText("finish quiz")).not.toBeInTheDocument();
  });

  it("shows the Daily Quick Quiz instead of children when not completed today", () => {
    hasCompletedQuizTodayMock.mockReturnValue(false);

    render(
      <OnboardingGate>
        <div>Dashboard content</div>
      </OnboardingGate>
    );

    expect(screen.getByText("finish quiz")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard content")).not.toBeInTheDocument();
  });

  it("marks the quiz complete and reveals the dashboard for a student", () => {
    hasCompletedQuizTodayMock.mockReturnValue(false);
    appContextValue = { role: "student" };

    render(
      <OnboardingGate>
        <div>Dashboard content</div>
      </OnboardingGate>
    );

    fireEvent.click(screen.getByText("finish quiz"));

    expect(markQuizCompletedTodayMock).toHaveBeenCalled();
    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("redirects a recruiter to their real dashboard instead of revealing the student dashboard", () => {
    hasCompletedQuizTodayMock.mockReturnValue(false);
    appContextValue = { role: "recruiter" };

    render(
      <OnboardingGate>
        <div>Dashboard content</div>
      </OnboardingGate>
    );

    fireEvent.click(screen.getByText("finish quiz"));

    expect(markQuizCompletedTodayMock).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith("/recruiter/dashboard?tab=candidates", { replace: true });
    expect(screen.queryByText("Dashboard content")).not.toBeInTheDocument();
  });

  it("redirects a TPO to their real dashboard instead of revealing the student dashboard", () => {
    hasCompletedQuizTodayMock.mockReturnValue(false);
    appContextValue = { role: "tpo" };

    render(
      <OnboardingGate>
        <div>Dashboard content</div>
      </OnboardingGate>
    );

    fireEvent.click(screen.getByText("finish quiz"));

    expect(navigateMock).toHaveBeenCalledWith("/tpo/dashboard?tab=overview", { replace: true });
  });
});