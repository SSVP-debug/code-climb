import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GuestProvider } from "./GuestProvider";
import { useGuest } from "../hooks/useGuest";

let authValue = { user: null, loading: false };
vi.mock("../hooks/useAuth", () => ({
  useAuth: () => authValue,
}));

// Tiny consumer that surfaces context state as text/buttons, same pattern
// DailyQuizProvider.test.jsx uses for its own provider.
function Probe() {
  const { isGuest, guestPortal, enterGuestMode, exitGuestMode } = useGuest();
  return (
    <div>
      <div>isGuest: {String(isGuest)}</div>
      <div>guestPortal: {String(guestPortal)}</div>
      <button onClick={() => enterGuestMode("student")}>enter student</button>
      <button onClick={() => enterGuestMode("recruiter")}>enter recruiter</button>
      <button onClick={() => enterGuestMode("not-a-real-portal")}>enter invalid</button>
      <button onClick={exitGuestMode}>exit</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <GuestProvider>
      <Probe />
    </GuestProvider>
  );
}

describe("GuestProvider", () => {
  beforeEach(() => {
    authValue = { user: null, loading: false };
    sessionStorage.clear();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("starts out not a guest with no sessionStorage entry", () => {
    renderProvider();
    expect(screen.getByText("isGuest: false")).toBeInTheDocument();
    expect(screen.getByText("guestPortal: null")).toBeInTheDocument();
  });

  it("enterGuestMode sets isGuest/guestPortal and persists to sessionStorage", () => {
    renderProvider();
    fireEvent.click(screen.getByText("enter student"));

    expect(screen.getByText("isGuest: true")).toBeInTheDocument();
    expect(screen.getByText("guestPortal: student")).toBeInTheDocument();
    expect(sessionStorage.getItem("codeclub_guest_portal")).toBe("student");
  });

  it("switching portals (student → recruiter) updates guestPortal", () => {
    renderProvider();
    fireEvent.click(screen.getByText("enter student"));
    fireEvent.click(screen.getByText("enter recruiter"));

    expect(screen.getByText("guestPortal: recruiter")).toBeInTheDocument();
    expect(sessionStorage.getItem("codeclub_guest_portal")).toBe("recruiter");
  });

  it("ignores an invalid portal name — never enters guest mode for it", () => {
    renderProvider();
    fireEvent.click(screen.getByText("enter invalid"));

    expect(screen.getByText("isGuest: false")).toBeInTheDocument();
    expect(sessionStorage.getItem("codeclub_guest_portal")).toBeNull();
  });

  it("exitGuestMode clears isGuest/guestPortal and sessionStorage", () => {
    renderProvider();
    fireEvent.click(screen.getByText("enter student"));
    fireEvent.click(screen.getByText("exit"));

    expect(screen.getByText("isGuest: false")).toBeInTheDocument();
    expect(screen.getByText("guestPortal: null")).toBeInTheDocument();
    expect(sessionStorage.getItem("codeclub_guest_portal")).toBeNull();
  });

  it("restores a previously-entered guest portal from sessionStorage on mount", () => {
    sessionStorage.setItem("codeclub_guest_portal", "tpo");
    renderProvider();

    expect(screen.getByText("isGuest: true")).toBeInTheDocument();
    expect(screen.getByText("guestPortal: tpo")).toBeInTheDocument();
  });

  it("ignores a corrupted/unrecognized sessionStorage value on mount", () => {
    sessionStorage.setItem("codeclub_guest_portal", "totally-bogus");
    renderProvider();

    expect(screen.getByText("isGuest: false")).toBeInTheDocument();
    expect(screen.getByText("guestPortal: null")).toBeInTheDocument();
  });

  // Guest → authenticated transition: the single source of truth for
  // clearing guest state once a real Firebase session appears — nothing
  // else should need to remember to call exitGuestMode() after login.
  it("clears guest state automatically once a real user is present", () => {
    const { rerender } = render(
      <GuestProvider>
        <Probe />
      </GuestProvider>
    );
    fireEvent.click(screen.getByText("enter student"));
    expect(screen.getByText("isGuest: true")).toBeInTheDocument();

    authValue = { user: { uid: "u1" }, loading: false };
    rerender(
      <GuestProvider>
        <Probe />
      </GuestProvider>
    );

    expect(screen.getByText("isGuest: false")).toBeInTheDocument();
    expect(screen.getByText("guestPortal: null")).toBeInTheDocument();
    expect(sessionStorage.getItem("codeclub_guest_portal")).toBeNull();
  });

  it("reports isGuest: false and guestPortal: null while a real user is present, even if internal guest state hasn't cleared yet", () => {
    // Exercises the value's own derivation (isGuest: Boolean(guestPortal)
    // && !user) directly, independent of the clear-on-login effect above.
    authValue = { user: { uid: "u1" }, loading: false };
    renderProvider();

    expect(screen.getByText("isGuest: false")).toBeInTheDocument();
    expect(screen.getByText("guestPortal: null")).toBeInTheDocument();
  });
});
