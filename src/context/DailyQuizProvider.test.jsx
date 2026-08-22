import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import DailyQuizProvider from "./DailyQuizProvider";
import { useDailyQuizStatus } from "../hooks/useDailyQuizStatus";

let authValue = { user: null, loading: true };
vi.mock("../hooks/useAuth", () => ({
  useAuth: () => authValue,
}));

let appContextValue = { role: "student", isBackendReady: true };
vi.mock("../hooks/useAppContext", () => ({
  useAppContext: () => appContextValue,
}));

const getDailyQuizStatusMock = vi.fn();
const completeDailyQuizMock = vi.fn();
vi.mock("../services/dailyQuizService", () => ({
  getDailyQuizStatus: (...args) => getDailyQuizStatusMock(...args),
  completeDailyQuiz: (...args) => completeDailyQuizMock(...args),
}));

// Tiny consumer that surfaces context state as text/buttons so tests can
// assert on it without needing DailyQuizGate.
function Probe() {
  const { status, isBackendReady, retry, completeQuiz, completing, completeError } =
    useDailyQuizStatus();
  return (
    <div>
      <div>status: {status}</div>
      <div>isBackendReady: {String(isBackendReady)}</div>
      <div>completing: {String(completing)}</div>
      {completeError && <div>error: {completeError}</div>}
      <button onClick={retry}>retry</button>
      <button onClick={completeQuiz}>complete</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <DailyQuizProvider>
      <Probe />
    </DailyQuizProvider>
  );
}

describe("DailyQuizProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authValue = { user: null, loading: true };
    appContextValue = { role: "student", isBackendReady: true };
  });

  it("stays loading while auth is still resolving, without fetching", () => {
    authValue = { user: null, loading: true };

    renderProvider();

    expect(screen.getByText("status: loading")).toBeInTheDocument();
    expect(getDailyQuizStatusMock).not.toHaveBeenCalled();
  });

  it("stays loading for a logged-out visitor, without fetching (public routes never consult this)", () => {
    authValue = { user: null, loading: false };

    renderProvider();

    expect(screen.getByText("status: loading")).toBeInTheDocument();
    expect(getDailyQuizStatusMock).not.toHaveBeenCalled();
  });

  it("fetches and reports required=true as status 'required'", async () => {
    authValue = { user: { uid: "u1" }, loading: false };
    getDailyQuizStatusMock.mockResolvedValue({ required: true, completed: false });

    renderProvider();

    await waitFor(() => expect(screen.getByText("status: required")).toBeInTheDocument());
  });

  it("fetches and reports required=false as status 'unlocked'", async () => {
    authValue = { user: { uid: "u1" }, loading: false };
    getDailyQuizStatusMock.mockResolvedValue({ required: false, completed: true });

    renderProvider();

    await waitFor(() => expect(screen.getByText("status: unlocked")).toBeInTheDocument());
  });

  it("fails closed to an error status (not unlocked) if the status fetch fails", async () => {
    authValue = { user: { uid: "u1" }, loading: false };
    getDailyQuizStatusMock.mockRejectedValue(new Error("network down"));

    renderProvider();

    await waitFor(() => expect(screen.getByText("status: error")).toBeInTheDocument());
  });

  it("retries the status fetch when retry() is called", async () => {
    authValue = { user: { uid: "u1" }, loading: false };
    getDailyQuizStatusMock
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce({ required: false, completed: true });

    renderProvider();

    await waitFor(() => expect(screen.getByText("status: error")).toBeInTheDocument());
    fireEvent.click(screen.getByText("retry"));

    await waitFor(() => expect(screen.getByText("status: unlocked")).toBeInTheDocument());
  });

  it("completeQuiz persists to the server and flips status to unlocked", async () => {
    authValue = { user: { uid: "u1" }, loading: false };
    getDailyQuizStatusMock.mockResolvedValue({ required: true, completed: false });
    completeDailyQuizMock.mockResolvedValue({ required: false, completed: true });

    renderProvider();

    await waitFor(() => expect(screen.getByText("status: required")).toBeInTheDocument());
    fireEvent.click(screen.getByText("complete"));

    expect(completeDailyQuizMock).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText("status: unlocked")).toBeInTheDocument());
  });

  it("does not unlock and surfaces an error if completeQuiz fails", async () => {
    authValue = { user: { uid: "u1" }, loading: false };
    getDailyQuizStatusMock.mockResolvedValue({ required: true, completed: false });
    completeDailyQuizMock.mockRejectedValue(new Error("db down"));

    renderProvider();

    await waitFor(() => expect(screen.getByText("status: required")).toBeInTheDocument());
    fireEvent.click(screen.getByText("complete"));

    await waitFor(() => expect(screen.getByText("error: db down")).toBeInTheDocument());
    expect(screen.getByText("status: required")).toBeInTheDocument();
  });

  it("exempts admin without ever calling the status endpoint", async () => {
    authValue = { user: { uid: "u1" }, loading: false };
    appContextValue = { role: "admin", isBackendReady: true };

    renderProvider();

    await waitFor(() => expect(screen.getByText("status: unlocked")).toBeInTheDocument());
    expect(getDailyQuizStatusMock).not.toHaveBeenCalled();
  });

  it("waits for role to hydrate before deciding, so it doesn't briefly unlock or gate for the wrong role", () => {
    authValue = { user: { uid: "u1" }, loading: false };
    appContextValue = { role: "student", isBackendReady: false };

    renderProvider();

    expect(screen.getByText("status: loading")).toBeInTheDocument();
    expect(getDailyQuizStatusMock).not.toHaveBeenCalled();
  });
});
