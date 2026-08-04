import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TodaysFocus from "./TodaysFocus";

vi.mock("../../context/ThemeContext", () => ({
  useTheme: () => ({ theme: { colors: { primary: "#2dd4bf" } } }),
}));

describe("TodaysFocus", () => {
  it("renders the given topic", () => {
    render(<TodaysFocus topic="Sliding Window" onContinue={() => {}} />);

    expect(screen.getByText("Sliding Window")).toBeInTheDocument();
  });

  it("calls onContinue when the CTA is clicked", () => {
    const onContinue = vi.fn();
    render(<TodaysFocus topic="Recursion" onContinue={onContinue} />);

    fireEvent.click(screen.getByRole("button"));
    expect(onContinue).toHaveBeenCalled();
  });
});