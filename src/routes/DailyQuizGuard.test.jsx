import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import DailyQuizGuard from "./DailyQuizGuard";

let authValue = { user: null, loading: true };
vi.mock("../hooks/useAuth", () => ({
  useAuth: () => authValue,
}));

let appContextValue = { role: "student", isBackendReady: true };
vi.mock("../hooks/useAppContext", () => ({
  useAppContext: () => appContextValue,
}));

const getDailyQuizStatusMock = vi.fn();
const completeDailyQuizMock = vi.fn();
vi.mock("../services/dailyQuizService", () => ({
  getDailyQuizStatus: (...args) => getDailyQuizStatusMock(...args),
  completeDailyQuiz: (...args) => completeDailyQuizMock(...args),
}));

// DailyQuickQuiz owns the actual question UI and is covered by its own
// tests — stub it down to a single button that calls onComplete, same
// pattern the old OnboardingGate.test.jsx used for OnboardingContainer.
vi.mock("../components/onboarding/DailyQuickQuiz", () => ({
  default: ({ onComplete }) => (
    <button onClick={() => onComplete({ score: 5 })}>finish quiz</button>
  ),
}));

describe("DailyQuizGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authValue = { user: null, loading: true };
    appContextValue = { role: "student", isBackendReady: true };
  });

  it("renders children immediately while Firebase auth is still resolving", () => {
    authValue = { user: null, loading: true };

    render(
      <DailyQuizGuard>
        <div>app content</div>
      </DailyQuizGuard>
    );

    expect(screen.getByText("app content")).toBeInTheDocument();
    expect(getDailyQuizStatusMock).not.toHaveBeenCalled();
  });

  it("renders children immediately for a logged-out visitor (public routes unaffected)", () => {
    authValue = { user: null, loading: false };

    render(
      <DailyQuizGuard>
        <div>app content</div>
      </DailyQuizGuard>
    );

    expect(screen.getByText("app content")).toBeInTheDocument();
    expect(getDailyQuizStatusMock).not.toHaveBeenCalled();
  });

  it("shows a loading state (not children, not the quiz) while status is being checked", async () => {
    authValue = { user: { uid: "u1" }, loading: false };
    let resolveStatus;
    getDailyQuizStatusMock.mockReturnValue(
      new Promise((resolve) => {
        resolveStatus = resolve;
      })
    );

    render(
      <DailyQuizGuard>
        <div>app content</div>
      </DailyQuizGuard>
    );

    expect(screen.queryByText("app content")).not.toBeInTheDocument();
    expect(screen.queryByText("finish quiz")).not.toBeInTheDocument();

    resolveStatus({ required: false, completed: true });
    await waitFor(() => expect(screen.getByText("app content")).toBeInTheDocument());
  });

  it("renders the quiz — not children — when the server says today's quiz is required", async () => {
    authValue = { user: { uid: "u1" }, loading: false };
    getDailyQuizStatusMock.mockResolvedValue({ required: true, completed: false });

    render(
      <DailyQuizGuard>
        <div>app content</div>
      </DailyQuizGuard>
    );

    await waitFor(() => expect(screen.getByText("finish quiz")).toBeInTheDocument());
    expect(screen.queryByText("app content")).not.toBeInTheDocument();
  });

  it("renders children directly when the server says today's quiz is already completed", async () => {
    authValue = { user: { uid: "u1" }, loading: false };
    getDailyQuizStatusMock.mockResolvedValue({ required: false, completed: true });

    render(
      <DailyQuizGuard>
        <div>app content</div>
      </DailyQuizGuard>
    );

    await waitFor(() => expect(screen.getByText("app content")).toBeInTheDocument());
    expect(screen.queryByText("finish quiz")).not.toBeInTheDocument();
  });

  it("persists completion to the server and unlocks the app once done", async () => {
    authValue = { user: { uid: "u1" }, loading: false };
    getDailyQuizStatusMock.mockResolvedValue({ required: true, completed: false });
    completeDailyQuizMock.mockResolvedValue({ required: false, completed: true });

    render(
      <DailyQuizGuard>
        <div>app content</div>
      </DailyQuizGuard>
    );

    await waitFor(() => expect(screen.getByText("finish quiz")).toBeInTheDocument());
    fireEvent.click(screen.getByText("finish quiz"));

    expect(completeDailyQuizMock).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText("app content")).toBeInTheDocument());
  });

  it("does NOT unlock the app if the completion request fails, and lets the person retry", async () => {
    authValue = { user: { uid: "u1" }, loading: false };
    getDailyQuizStatusMock.mockResolvedValue({ required: true, completed: false });
    completeDailyQuizMock
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce({ required: false, completed: true });

    render(
      <DailyQuizGuard>
        <div>app content</div>
      </DailyQuizGuard>
    );

    await waitFor(() => expect(screen.getByText("finish quiz")).toBeInTheDocument());
    fireEvent.click(screen.getByText("finish quiz"));

    await waitFor(() => expect(screen.getByText(/couldn't save your result/i)).toBeInTheDocument());
    expect(screen.queryByText("app content")).not.toBeInTheDocument();

    // Retry succeeds and unlocks.
    fireEvent.click(screen.getByText("Retry"));
    await waitFor(() => expect(screen.getByText("app content")).toBeInTheDocument());
  });

  it("does NOT silently unlock the app if the status check fails, and offers a retry", async () => {
    authValue = { user: { uid: "u1" }, loading: false };
    getDailyQuizStatusMock
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce({ required: false, completed: true });

    render(
      <DailyQuizGuard>
        <div>app content</div>
      </DailyQuizGuard>
    );

    await waitFor(() =>
      expect(screen.getByText(/couldn't load today's warm-up/i)).toBeInTheDocument()
    );
    expect(screen.queryByText("app content")).not.toBeInTheDocument();
    expect(screen.queryByText("finish quiz")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Retry"));
    await waitFor(() => expect(screen.getByText("app content")).toBeInTheDocument());
  });

  it("exempts admin from the quiz gate once role has hydrated, without ever calling the status endpoint", async () => {
    authValue = { user: { uid: "u1" }, loading: false };
    appContextValue = { role: "admin", isBackendReady: true };

    render(
      <DailyQuizGuard>
        <div>app content</div>
      </DailyQuizGuard>
    );

    await waitFor(() => expect(screen.getByText("app content")).toBeInTheDocument());
    expect(getDailyQuizStatusMock).not.toHaveBeenCalled();
  });

  it("waits for role to hydrate before deciding, so it doesn't briefly gate an admin", () => {
    authValue = { user: { uid: "u1" }, loading: false };
    appContextValue = { role: "student", isBackendReady: false };

    render(
      <DailyQuizGuard>
        <div>app content</div>
      </DailyQuizGuard>
    );

    expect(screen.queryByText("app content")).not.toBeInTheDocument();
    expect(getDailyQuizStatusMock).not.toHaveBeenCalled();
  });
});
