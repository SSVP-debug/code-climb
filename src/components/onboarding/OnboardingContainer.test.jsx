import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import OnboardingContainer from "./OnboardingContainer";

vi.mock("./WelcomeScreen", () => ({
  default: ({ onStart }) => <button onClick={onStart}>welcome-next</button>,
}));

vi.mock("./DailyQuickQuiz", () => ({
  default: ({ onComplete }) => <button onClick={onComplete}>quiz-next</button>,
}));

vi.mock("./DailyMission", () => ({
  default: ({ onContinue }) => <button onClick={onContinue}>mission-next</button>,
}));

vi.mock("./TodaysFocus", () => ({
  default: ({ topic, onContinue }) => (
    <button onClick={onContinue}>focus-next: {topic}</button>
  ),
}));

vi.mock("./WorkspacePreparationScreen", () => ({
  default: ({ onReady }) => <button onClick={onReady}>readiness-next</button>,
}));

const hasCompletedQuizTodayMock = vi.fn();
const markQuizCompletedTodayMock = vi.fn();
vi.mock("../../utils/dailyQuizStorage", () => ({
  hasCompletedQuizToday: () => hasCompletedQuizTodayMock(),
  markQuizCompletedToday: () => markQuizCompletedTodayMock(),
}));

describe("OnboardingContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("walks Welcome -> Quiz -> Mission -> Focus -> Readiness when quiz hasn't been done today, calling onComplete only at the very end", () => {
    hasCompletedQuizTodayMock.mockReturnValue(false);
    const onComplete = vi.fn();
    render(<OnboardingContainer onComplete={onComplete} />);

    expect(screen.getByText("welcome-next")).toBeInTheDocument();
    fireEvent.click(screen.getByText("welcome-next"));

    expect(screen.getByText("quiz-next")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("quiz-next"));
    expect(markQuizCompletedTodayMock).toHaveBeenCalled();

    expect(screen.getByText("mission-next")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("mission-next"));

    expect(screen.getByText(/^focus-next:/)).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText(/^focus-next:/));

    expect(screen.getByText("readiness-next")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("readiness-next"));

    expect(onComplete).toHaveBeenCalled();
  });

  it("skips the Quiz step when it was already completed today, going straight Welcome -> Mission", () => {
    hasCompletedQuizTodayMock.mockReturnValue(true);
    const onComplete = vi.fn();
    render(<OnboardingContainer onComplete={onComplete} />);

    fireEvent.click(screen.getByText("welcome-next"));

    expect(screen.queryByText("quiz-next")).not.toBeInTheDocument();
    expect(screen.getByText("mission-next")).toBeInTheDocument();
    expect(markQuizCompletedTodayMock).not.toHaveBeenCalled();
  });

  it("never advances past the last step", () => {
    hasCompletedQuizTodayMock.mockReturnValue(true);
    render(<OnboardingContainer onComplete={vi.fn()} />);

    fireEvent.click(screen.getByText("welcome-next"));
    fireEvent.click(screen.getByText("mission-next"));
    fireEvent.click(screen.getByText(/^focus-next:/));

    expect(screen.getByText("readiness-next")).toBeInTheDocument();
  });
});