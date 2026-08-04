import { describe, expect, it, vi } from "vitest";
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

describe("OnboardingContainer", () => {
  it("walks Welcome -> Quiz -> Mission -> Focus, calling onComplete only at the very end", () => {
    const onComplete = vi.fn();
    render(<OnboardingContainer onComplete={onComplete} />);

    expect(screen.getByText("welcome-next")).toBeInTheDocument();
    fireEvent.click(screen.getByText("welcome-next"));

    expect(screen.getByText("quiz-next")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("quiz-next"));

    expect(screen.getByText("mission-next")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("mission-next"));

    expect(screen.getByText(/^focus-next:/)).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText(/^focus-next:/));

    expect(onComplete).toHaveBeenCalled();
  });
});