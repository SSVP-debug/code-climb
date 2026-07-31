import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import LoginPage from "./LoginPage";

// ── Mocks ────────────────────────────────────────────────────────────────
const navigateMock = vi.fn();
let searchParamsValue = new URLSearchParams();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
  useSearchParams: () => [searchParamsValue],
}));

const apiFetchMock = vi.fn();
vi.mock("../services/api", () => ({
  apiFetch: (...args) => apiFetchMock(...args),
}));

vi.mock("../services/auth", () => ({
  signInWithGoogle: vi.fn(),
}));

let authValue = { user: null };
vi.mock("../context/authContext", () => ({
  useAuth: () => authValue,
}));

// Gate 3 audit, P0-1: LoginPage's redirectAfterAuth() fires from a useEffect
// when `user` is already truthy (the "already logged in" branch) — the
// simplest way to exercise it without simulating the full Google popup.
describe("LoginPage — post-login redirect (Gate 3 P0-1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsValue = new URLSearchParams();
    authValue = { user: null };
  });

  it("navigates to the preserved ?next= destination instead of the role default", async () => {
    searchParamsValue = new URLSearchParams({ next: "/club/public-contests/abc123" });
    authValue = { user: { uid: "1" } };

    render(<LoginPage />);

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith("/club/public-contests/abc123")
    );
    // Must not have also fallen through to /api/init's role-based default.
    expect(apiFetchMock).not.toHaveBeenCalledWith("/api/init");
  });

  it("rejects an unsafe ?next= value and falls back to the role-based destination", async () => {
    searchParamsValue = new URLSearchParams({ next: "https://evil.example/phish" });
    authValue = { user: { uid: "1" } };
    apiFetchMock.mockResolvedValueOnce({ user: { role: "student" } });

    render(<LoginPage />);

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/dashboard"));
    expect(navigateMock).not.toHaveBeenCalledWith("https://evil.example/phish");
  });

  it("falls back to the role-based destination when no ?next= is present", async () => {
    authValue = { user: { uid: "1" } };
    apiFetchMock.mockResolvedValueOnce({ user: { role: "recruiter" } });

    render(<LoginPage />);

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith("/recruiter/dashboard?tab=candidates")
    );
  });
});
