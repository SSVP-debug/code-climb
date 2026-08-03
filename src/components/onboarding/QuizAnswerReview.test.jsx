import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import QuizAnswerReview from "./QuizAnswerReview";

const questions = [
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

describe("QuizAnswerReview", () => {
  it("shows the question text and topic for every question", () => {
    render(<QuizAnswerReview questions={questions} answers={[0, 0]} />);

    expect(screen.getByText("Question 1 · Arrays")).toBeInTheDocument();
    expect(screen.getByText("What is the time complexity of array index access?")).toBeInTheDocument();
    expect(screen.getByText("Question 2 · DBMS")).toBeInTheDocument();
  });

  it("shows the correct answer only for questions answered incorrectly", () => {
    render(<QuizAnswerReview questions={questions} answers={[1, 0]} />);

    expect(screen.getByText("Your answer: O(n)")).toBeInTheDocument();
    expect(screen.getByText("Correct answer: O(1)")).toBeInTheDocument();

    expect(screen.getByText("Your answer: Atomicity")).toBeInTheDocument();
  });

  it("treats null (unanswered) as 'Not answered', not a crash", () => {
    expect(() =>
      render(<QuizAnswerReview questions={questions} answers={[null, 0]} />)
    ).not.toThrow();

    expect(screen.getByText("Your answer: Not answered")).toBeInTheDocument();
    expect(screen.getByText("Correct answer: O(1)")).toBeInTheDocument();
  });
});