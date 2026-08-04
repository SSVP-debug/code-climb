import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DailyMission from "./DailyMission";

vi.mock("../../context/ThemeContext", () => ({
  useTheme: () => ({ theme: { colors: { primary: "#2dd4bf" } } }),
}));

let appContextValue = { currentStreak: 0 };
vi.mock("../../hooks/useAppContext", () => ({
  useAppContext: () => appContextValue,
}));

describe("DailyMission", () => {
  it("asks the user to start a streak when they don't have one yet", () => {
    appContextValue = { currentStreak: 0 };
    render(<DailyMission onContinue={() => {}} />);

    expect(screen.getByText("Start your streak")).toBeInTheDocument();
    expect(screen.queryByText("Maintain your streak")).not.toBeInTheDocument();
  });

  it("asks the user to maintain their streak when they already have one", () => {
    appContextValue = { currentStreak: 4 };
    render(<DailyMission onContinue={() => {}} />);

    expect(screen.getByText("Maintain your streak")).toBeInTheDocument();
    expect(screen.queryByText("Start your streak")).not.toBeInTheDocument();
  });

  it("shows the other two static goals and calls onContinue on CTA click", () => {
    appContextValue = { currentStreak: 0 };
    const onContinue = vi.fn();
    render(<DailyMission onContinue={onContinue} />);

    expect(screen.getByText("Solve 2 problems")).toBeInTheDocument();
    expect(screen.getByText("Beat yesterday's runtime")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));
    expect(onContinue).toHaveBeenCalled();
  });
});