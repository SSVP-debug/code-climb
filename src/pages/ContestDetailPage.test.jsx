import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import ContestDetailPage from "./ContestDetailPage";

const apiFetchMock = vi.fn();
vi.mock("../services/api", () => ({
  apiFetch: (...args) => apiFetchMock(...args),
}));

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("../hooks/useTheme", () => ({
  useTheme: () => ({
    theme: { colors: { primary: "#2dd4bf" }, words: {} },
  }),
}));

vi.mock("../layouts/DashboardLayout", () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock("../components/club/ClubSubNav", () => ({
  default: () => <div>Club Sub Nav</div>,
}));

const navigateMock = vi.fn();
vi.mock("react-router-dom", () => ({
  useParams: () => ({ id: "contest123" }),
  useNavigate: () => navigateMock,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

const baseContest = {
  _id: "contest123",
  title: "Fest Kickoff Contest",
  description: "Solve 3 problems",
  status: "active",
  type: "public",
  endsAt: new Date(Date.now() + 3600_000).toISOString(),
  leaderboard: [],
  problemSlugs: ["two-sum", "reverse-list"],
  problemCount: 2,
  myRank: null,
  myScore: 0,
  mySolvedSlugs: [],
  isJoined: false,
};

describe("ContestDetailPage — Join CTA (Gate 3 P0-2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a Join Contest button for a public contest the participant hasn't joined", async () => {
    apiFetchMock.mockResolvedValueOnce(baseContest);
    render(<ContestDetailPage />);

    expect(await screen.findByText("You haven't joined this contest yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Join Contest" })).toBeInTheDocument();
  });

  it("calls POST /api/contests/:id/join and refreshes the contest when Join Contest is clicked", async () => {
    apiFetchMock.mockResolvedValueOnce(baseContest); // initial fetch
    apiFetchMock.mockResolvedValueOnce({}); // join call
    apiFetchMock.mockResolvedValueOnce({ ...baseContest, isJoined: true, myScore: 0 }); // refetch after join

    render(<ContestDetailPage />);
    const joinButton = await screen.findByRole("button", { name: "Join Contest" });

    fireEvent.click(joinButton);

    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith("/api/contests/contest123/join", { method: "POST" })
    );
    // The join banner should disappear once isJoined flips to true.
    await waitFor(() =>
      expect(screen.queryByText("You haven't joined this contest yet")).not.toBeInTheDocument()
    );
  });

  it("shows an invite-code link instead of a Join button for a private contest", async () => {
    apiFetchMock.mockResolvedValueOnce({ ...baseContest, type: "private" });
    render(<ContestDetailPage />);

    expect(await screen.findByText("This is a private contest")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Join Contest" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Enter invite code →" })).toHaveAttribute(
      "href",
      "/club/private-contests"
    );
  });

  it("does not show a Join CTA once the participant has already joined", async () => {
    apiFetchMock.mockResolvedValueOnce({ ...baseContest, isJoined: true, myScore: 40, myRank: 2 });
    render(<ContestDetailPage />);

    await screen.findByText("Fest Kickoff Contest");
    expect(screen.queryByText("You haven't joined this contest yet")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Join Contest" })).not.toBeInTheDocument();
  });

  it("does not show a Join CTA for an ended contest", async () => {
    apiFetchMock.mockResolvedValueOnce({ ...baseContest, status: "ended", isJoined: false });
    render(<ContestDetailPage />);

    await screen.findByText("Fest Kickoff Contest");
    expect(screen.queryByText("You haven't joined this contest yet")).not.toBeInTheDocument();
  });
});

describe("ContestDetailPage — upcoming-contest polling (Gate 3 P1-1)", () => {
  const upcomingContest = {
    ...baseContest,
    status: "upcoming",
    problemSlugs: [],
    isJoined: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("re-fetches the contest on an interval while status is upcoming, without a manual refresh", async () => {
    apiFetchMock.mockResolvedValue(upcomingContest);
    render(<ContestDetailPage />);

    await screen.findByText("Fest Kickoff Contest");
    expect(apiFetchMock).toHaveBeenCalledTimes(1);

    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(apiFetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("stops polling once the contest transitions to active", async () => {
    apiFetchMock
      .mockResolvedValueOnce(upcomingContest)
      .mockResolvedValue({ ...upcomingContest, status: "active", problemSlugs: ["two-sum"] });

    render(<ContestDetailPage />);
    await screen.findByText("Fest Kickoff Contest");

    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    const callsAfterTransition = apiFetchMock.mock.calls.length;
    expect(callsAfterTransition).toBeGreaterThanOrEqual(2);

    // Advance well past several more would-be poll intervals. Once the
    // component has re-rendered with status "active" it stops scheduling
    // new polls — a single straggler poll already in flight at the moment
    // of transition is acceptable, but polling must not continue indefinitely.
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(apiFetchMock.mock.calls.length).toBeLessThanOrEqual(callsAfterTransition + 1);
  });
});
