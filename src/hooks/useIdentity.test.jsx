import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useIdentity } from "./useIdentity";

let authValue = { user: null, loading: false };
vi.mock("./useAuth", () => ({
  useAuth: () => authValue,
}));

let guestValue = { isGuest: false, guestPortal: null };
vi.mock("./useGuest", () => ({
  useGuest: () => guestValue,
}));

function Probe() {
  const identity = useIdentity();
  return (
    <div>
      <div>status: {identity.status}</div>
      <div>isLoading: {String(identity.isLoading)}</div>
      <div>isAuthenticated: {String(identity.isAuthenticated)}</div>
      <div>isGuest: {String(identity.isGuest)}</div>
      <div>isUnauthenticated: {String(identity.isUnauthenticated)}</div>
      <div>guestPortal: {String(identity.guestPortal)}</div>
    </div>
  );
}

describe("useIdentity", () => {
  it("reports loading while Firebase's initial auth state hasn't resolved", () => {
    authValue = { user: null, loading: true };
    guestValue = { isGuest: false, guestPortal: null };
    render(<Probe />);

    expect(screen.getByText("status: loading")).toBeInTheDocument();
    expect(screen.getByText("isLoading: true")).toBeInTheDocument();
  });

  it("reports authenticated when a real Firebase user is present", () => {
    authValue = { user: { uid: "u1" }, loading: false };
    guestValue = { isGuest: false, guestPortal: null };
    render(<Probe />);

    expect(screen.getByText("status: authenticated")).toBeInTheDocument();
    expect(screen.getByText("isAuthenticated: true")).toBeInTheDocument();
    expect(screen.getByText("isGuest: false")).toBeInTheDocument();
  });

  it("reports guest when there's no user but a guest portal is active", () => {
    authValue = { user: null, loading: false };
    guestValue = { isGuest: true, guestPortal: "recruiter" };
    render(<Probe />);

    expect(screen.getByText("status: guest")).toBeInTheDocument();
    expect(screen.getByText("isGuest: true")).toBeInTheDocument();
    expect(screen.getByText("isAuthenticated: false")).toBeInTheDocument();
    expect(screen.getByText("guestPortal: recruiter")).toBeInTheDocument();
  });

  it("reports unauthenticated when there's no user and no guest session", () => {
    authValue = { user: null, loading: false };
    guestValue = { isGuest: false, guestPortal: null };
    render(<Probe />);

    expect(screen.getByText("status: unauthenticated")).toBeInTheDocument();
    expect(screen.getByText("isUnauthenticated: true")).toBeInTheDocument();
  });

  it("prefers authenticated over guest if both were somehow true (real user always wins)", () => {
    // Shouldn't happen in practice — GuestProvider clears guest state the
    // instant a real user appears — but useIdentity's own precedence
    // (checked in order: loading → authenticated → guest) is what
    // guarantees that even a stale guest value can never grant guest-level
    // treatment to an authenticated session.
    authValue = { user: { uid: "u1" }, loading: false };
    guestValue = { isGuest: true, guestPortal: "tpo" };
    render(<Probe />);

    expect(screen.getByText("status: authenticated")).toBeInTheDocument();
    expect(screen.getByText("isAuthenticated: true")).toBeInTheDocument();
    expect(screen.getByText("isGuest: false")).toBeInTheDocument();
  });
});
