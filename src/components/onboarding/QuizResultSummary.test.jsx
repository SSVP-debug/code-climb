import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import QuizResultSummary from "./QuizResultSummary";

describe("QuizResultSummary", () => {
  it("shows the score and strongest topic", () => {
    render(
      <QuizResultSummary
        result={{ correctCount: 3, total: 5, strongestTopic: "Graphs", improvementTopic: "DBMS" }}
      />
    );

    expect(screen.getByText("3 / 5 correct")).toBeInTheDocument();
    expect(screen.getByText("Graphs")).toBeInTheDocument();
    expect(screen.getByText(/Improvement area: DBMS/)).toBeInTheDocument();
  });

  it("never renders an error state for a null strongestTopic (0 correct — 'never punish')", () => {
    render(
      <QuizResultSummary
        result={{ correctCount: 0, total: 5, strongestTopic: null, improvementTopic: "Arrays" }}
      />
    );

    expect(screen.getByText("0 / 5 correct")).toBeInTheDocument();
    expect(screen.getByText(/tomorrow's a fresh set/i)).toBeInTheDocument();
  });

  it("shows a perfect-score message instead of an error when improvementTopic is null", () => {
    render(
      <QuizResultSummary
        result={{ correctCount: 5, total: 5, strongestTopic: "Trees", improvementTopic: null }}
      />
    );

    expect(screen.getByText("5 / 5 correct")).toBeInTheDocument();
    expect(screen.getByText(/no weak spot flagged today/i)).toBeInTheDocument();
  });
});