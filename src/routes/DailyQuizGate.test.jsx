import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DailyQuizGate from "./DailyQuizGate";
import { DailyQuizContext } from "../context/DailyQuizContextObject";

// DailyQuickQuiz owns the actual question UI and is covered by its own
// tests — stub it down to a single button that calls onComplete.
vi.mock("../components/onboarding/DailyQuickQuiz", () => ({
  default: ({ onComplete }) => (
    <button onClick={() => onComplete({ score: 5 })}>finish quiz</button>
  ),
}));

function renderGate(value) {
  return render(
    <DailyQuizContext.Provider value={value}>
      <DailyQuizGate>
        <div>protected content</div>
      </DailyQuizGate>
    </DailyQuizContext.Provider>
  );
}

const base = {
  status: "unlocked",
  isBackendReady: true,
  retry: vi.fn(),
  completeQuiz: vi.fn(),
  completing: false,
  completeError: null,
};

describe("DailyQuizGate", () => {
  it("renders children when unlocked", () => {
    renderGate({ ...base, status: "unlocked" });

    expect(screen.getByText("protected content")).toBeInTheDocument();
  });

  it("shows a loading state — not children, not the quiz — while backend isn't ready yet", () => {
    renderGate({ ...base, isBackendReady: false, status: "loading" });

    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
    expect(screen.queryByText("finish quiz")).not.toBeInTheDocument();
  });

  it("shows a loading state while status is still being checked", () => {
    renderGate({ ...base, status: "loading" });

    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
    expect(screen.queryByText("finish quiz")).not.toBeInTheDocument();
  });

  it("renders the quiz — not children — when required", () => {
    renderGate({ ...base, status: "required" });

    expect(screen.getByText("finish quiz")).toBeInTheDocument();
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });

  it("calls completeQuiz (context) when the quiz is finished, rather than unlocking locally", () => {
    const completeQuiz = vi.fn();
    renderGate({ ...base, status: "required", completeQuiz });

    fireEvent.click(screen.getByText("finish quiz"));

    expect(completeQuiz).toHaveBeenCalled();
  });

  it("shows a retry-able error state — not children — when the status check failed (fail closed)", () => {
    const retry = vi.fn();
    renderGate({ ...base, status: "error", retry });

    expect(screen.getByText(/couldn't load today's warm-up/i)).toBeInTheDocument();
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Retry"));
    expect(retry).toHaveBeenCalled();
  });

  it("shows a retry-able error under the quiz — and does not unlock — when completion failed", () => {
    renderGate({
      ...base,
      status: "required",
      completeError: "network down",
    });

    expect(screen.getByText(/couldn't save your result/i)).toBeInTheDocument();
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });
});
