import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import WorkspacePreparationScreen from "./WorkspacePreparationScreen";

vi.mock("../../context/ThemeContext", () => ({
  useTheme: () => ({ theme: { colors: { primary: "#2dd4bf" } } }),
}));

let appContextValue = { isBackendReady: false };
vi.mock("../../hooks/useAppContext", () => ({
  useAppContext: () => appContextValue,
}));

describe("WorkspacePreparationScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    appContextValue = { isBackendReady: false };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not call onReady while the backend isn't ready, even after the min-display floor passes", () => {
    const onReady = vi.fn();
    render(<WorkspacePreparationScreen onReady={onReady} />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onReady).not.toHaveBeenCalled();
  });

  it("does not call onReady the instant the backend becomes ready, before the min-display floor", () => {
    const onReady = vi.fn();
    appContextValue = { isBackendReady: true };
    render(<WorkspacePreparationScreen onReady={onReady} />);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onReady).not.toHaveBeenCalled();
  });

  it("calls onReady once both the backend is ready and the min-display floor has elapsed", () => {
    const onReady = vi.fn();
    appContextValue = { isBackendReady: true };
    render(<WorkspacePreparationScreen onReady={onReady} />);

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it("uses narrative, non-technical copy — no spinner/infra language", () => {
    render(<WorkspacePreparationScreen onReady={vi.fn()} />);

    expect(screen.getByText(/Building today's coding session/i)).toBeInTheDocument();
    expect(screen.queryByText(/connecting/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/loading server/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/initializing backend/i)).not.toBeInTheDocument();
  });
});