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

// OnboardingContainer owns the real Welcome -> [Quiz] -> Mission -> Focus ->
// Readiness sequencing (covered by its own tests); this file only cares
// about OnboardingGate's own logic (once-per-session gating + role
// redirect), so the container is stubbed down to a single button that
// calls its `onComplete`.
vi.mock("../components/onboarding/OnboardingContainer", () => ({
  default: ({ onComplete }) => (
    <button onClick={onComplete}>finish onboarding</button>
  ),
}));

let appContextValue = { role: "student" };
vi.mock("../hooks/useAppContext", () => ({
  useAppContext: () => appContextValue,
}));

const hasShownOnboardingThisSessionMock = vi.fn();
const markOnboardingShownThisSessionMock = vi.fn();
vi.mock("../utils/dailyQuizStorage", () => ({
  hasShownOnboardingThisSession: () => hasShownOnboardingThisSessionMock(),
  markOnboardingShownThisSession: () => markOnboardingShownThisSessionMock(),
}));

describe("OnboardingGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appContextValue = { role: "student" };
  });

  it("renders children directly when onboarding was already shown this session", () => {
    hasShownOnboardingThisSessionMock.mockReturnValue(true);

    render(
      <OnboardingGate>
        <div>Dashboard content</div>
      </OnboardingGate>
    );

    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(screen.queryByText("finish onboarding")).not.toBeInTheDocument();
  });

  it("shows the onboarding flow instead of children when not yet shown this session", () => {
    hasShownOnboardingThisSessionMock.mockReturnValue(false);

    render(
      <OnboardingGate>
        <div>Dashboard content</div>
      </OnboardingGate>
    );

    expect(screen.getByText("finish onboarding")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard content")).not.toBeInTheDocument();
  });

  it("marks onboarding shown for the session and reveals the dashboard for a student", () => {
    hasShownOnboardingThisSessionMock.mockReturnValue(false);
    appContextValue = { role: "student" };

    render(
      <OnboardingGate>
        <div>Dashboard content</div>
      </OnboardingGate>
    );

    fireEvent.click(screen.getByText("finish onboarding"));

    expect(markOnboardingShownThisSessionMock).toHaveBeenCalled();
    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("redirects a recruiter to their real dashboard instead of revealing the student dashboard", () => {
    hasShownOnboardingThisSessionMock.mockReturnValue(false);
    appContextValue = { role: "recruiter" };

    render(
      <OnboardingGate>
        <div>Dashboard content</div>
      </OnboardingGate>
    );

    fireEvent.click(screen.getByText("finish onboarding"));

    expect(markOnboardingShownThisSessionMock).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith("/recruiter/dashboard?tab=candidates", { replace: true });
    expect(screen.queryByText("Dashboard content")).not.toBeInTheDocument();
  });

  it("redirects a TPO to their real dashboard instead of revealing the student dashboard", () => {
    hasShownOnboardingThisSessionMock.mockReturnValue(false);
    appContextValue = { role: "tpo" };

    render(
      <OnboardingGate>
        <div>Dashboard content</div>
      </OnboardingGate>
    );

    fireEvent.click(screen.getByText("finish onboarding"));

    expect(navigateMock).toHaveBeenCalledWith("/tpo/dashboard?tab=overview", { replace: true });
  });
});