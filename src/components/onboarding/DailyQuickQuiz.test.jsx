import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import DailyQuickQuiz from "./DailyQuickQuiz";

// Fixed 2-question set so the flow is deterministic and fast to assert on.
// scoreQuizAttempt/selectDailyQuestions themselves are covered by
// src/utils/quizEngine.test.js — this file only tests how the component
// wires the engine's output into the quiz -> result UI.
const fixedQuestions = [
  {
    id: "q1",
    topic: "Arrays",
    question: "What is the time complexity of array index access?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
    correctIndex: 0,
  },
  {
    id: "q2",
    topic: "DBMS",
    question: "What does ACID stand for (the A)?",
    options: ["Atomicity", "Availability", "Aggregation", "Access"],
    correctIndex: 0,
  },
];

vi.mock("../../utils/quizEngine", async () => {
  const actual = await vi.importActual("../../utils/quizEngine");
  return {
    ...actual,
    selectDailyQuestions: () => fixedQuestions,
  };
});

describe("DailyQuickQuiz", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the first question with its topic and 4 options", () => {
    render(<DailyQuickQuiz onComplete={vi.fn()} />);

    expect(screen.getByText("Arrays")).toBeInTheDocument();
    expect(screen.getByText("What is the time complexity of array index access?")).toBeInTheDocument();
    expect(screen.getByText("O(1)")).toBeInTheDocument();
    expect(screen.getByText("O(n^2)")).toBeInTheDocument();
  });

  it("advances to the next question after answering, once the feedback delay elapses", () => {
    render(<DailyQuickQuiz onComplete={vi.fn()} />);

    fireEvent.click(screen.getByText("O(1)"));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("DBMS")).toBeInTheDocument();
    expect(screen.getByText("What does ACID stand for (the A)?")).toBeInTheDocument();
  });

  it("ignores extra clicks on other options while feedback is showing", () => {
    render(<DailyQuickQuiz onComplete={vi.fn()} />);

    fireEvent.click(screen.getByText("O(1)"));
    // Second click before the timer fires should be a no-op.
    fireEvent.click(screen.getByText("O(n)"));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Only one question should have advanced (still on question 2, not 3 —
    // there is no question 3 in the fixed set, so DBMS must be showing).
    expect(screen.getByText("DBMS")).toBeInTheDocument();
  });

  it("shows the result screen after the last question, with score and topic breakdown", () => {
    render(<DailyQuickQuiz onComplete={vi.fn()} />);

    fireEvent.click(screen.getByText("O(1)")); // correct
    act(() => vi.advanceTimersByTime(1000));

    fireEvent.click(screen.getByText("Atomicity")); // correct
    act(() => vi.advanceTimersByTime(1000));

    expect(screen.getByText("2 / 2 correct")).toBeInTheDocument();
    expect(screen.getByText("Arrays")).toBeInTheDocument();
    expect(screen.getByText(/no weak spot flagged today/i)).toBeInTheDocument();
  });

  it("shows a per-question review with the selected option and the correct option for wrong answers", () => {
    render(<DailyQuickQuiz onComplete={vi.fn()} />);

    fireEvent.click(screen.getByText("O(n)")); // wrong: picked O(n), correct is O(1)
    act(() => vi.advanceTimersByTime(1000));

    fireEvent.click(screen.getByText("Availability")); // wrong: picked Availability, correct is Atomicity
    act(() => vi.advanceTimersByTime(1000));

    expect(screen.getByText("Review your answers")).toBeInTheDocument();

    expect(screen.getByText("Question 1 · Arrays")).toBeInTheDocument();
    expect(screen.getByText("Your answer: O(n)")).toBeInTheDocument();
    expect(screen.getByText("Correct answer: O(1)")).toBeInTheDocument();

    expect(screen.getByText("Question 2 · DBMS")).toBeInTheDocument();
    expect(screen.getByText("Your answer: Availability")).toBeInTheDocument();
    expect(screen.getByText("Correct answer: Atomicity")).toBeInTheDocument();
  });

  it("does not show a 'Correct answer' line for a question answered correctly", () => {
    render(<DailyQuickQuiz onComplete={vi.fn()} />);

    fireEvent.click(screen.getByText("O(1)")); // correct
    act(() => vi.advanceTimersByTime(1000));

    fireEvent.click(screen.getByText("Atomicity")); // correct
    act(() => vi.advanceTimersByTime(1000));

    expect(screen.getByText("Your answer: O(1)")).toBeInTheDocument();
    expect(screen.getByText("Your answer: Atomicity")).toBeInTheDocument();
    expect(screen.queryByText(/Correct answer:/)).not.toBeInTheDocument();
  });

  it("calls onComplete with the computed result when Continue to Dashboard is clicked", () => {
    const onComplete = vi.fn();
    render(<DailyQuickQuiz onComplete={onComplete} />);

    fireEvent.click(screen.getByText("O(n)")); // wrong
    act(() => vi.advanceTimersByTime(1000));

    fireEvent.click(screen.getByText("Availability")); // wrong
    act(() => vi.advanceTimersByTime(1000));

    expect(screen.getByText("0 / 2 correct")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Continue to Dashboard"));
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({ correctCount: 0, total: 2 })
    );
  });
});