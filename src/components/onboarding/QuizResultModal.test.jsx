import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import QuizResultModal from "./QuizResultModal";

const sampleResult = {
  correctCount: 4,
  total: 5,
  strongestTopic: "Arrays",
  improvementTopic: "DBMS",
};

describe("QuizResultModal", () => {
  it("renders today's result", () => {
    render(<QuizResultModal result={sampleResult} onClose={vi.fn()} />);
    expect(screen.getByText("4 / 5 correct")).toBeInTheDocument();
  });

  it("calls onClose when the X button is clicked", () => {
    const onClose = vi.fn();
    render(<QuizResultModal result={sampleResult} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when the backdrop is clicked", () => {
    const onClose = vi.fn();
    render(<QuizResultModal result={sampleResult} onClose={onClose} />);

    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalled();
  });

  it("does not call onClose when clicking inside the card itself", () => {
    const onClose = vi.fn();
    render(<QuizResultModal result={sampleResult} onClose={onClose} />);

    fireEvent.click(screen.getByText("4 / 5 correct"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(<QuizResultModal result={sampleResult} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});