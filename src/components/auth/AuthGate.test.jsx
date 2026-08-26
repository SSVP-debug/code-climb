import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AuthGate, { AuthGateCard } from "./AuthGate";

let identityValue = { isAuthenticated: false };
vi.mock("../../hooks/useIdentity", () => ({
  useIdentity: () => identityValue,
}));

function renderWithRouter(ui, initialEntries = ["/problems/two-sum"]) {
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}

describe("AuthGate", () => {
  it("renders children directly when authenticated", () => {
    identityValue = { isAuthenticated: true };
    renderWithRouter(
      <AuthGate reason="candidates">
        <div>Real candidate data</div>
      </AuthGate>
    );

    expect(screen.getByText("Real candidate data")).toBeInTheDocument();
    expect(screen.queryByText("Sign in required")).not.toBeInTheDocument();
  });

  it("shows the sign-in gate instead of children when not authenticated (guest or unauthenticated)", () => {
    identityValue = { isAuthenticated: false };
    renderWithRouter(
      <AuthGate reason="candidates">
        <div>Real candidate data</div>
      </AuthGate>
    );

    expect(screen.queryByText("Real candidate data")).not.toBeInTheDocument();
    expect(screen.getByText("Sign in required")).toBeInTheDocument();
  });

  it("shows the preset message for the given reason", () => {
    identityValue = { isAuthenticated: false };
    renderWithRouter(<AuthGate reason="submit">x</AuthGate>);

    expect(
      screen.getByText("Create an account to submit solutions and save your progress.")
    ).toBeInTheDocument();
  });

  it("shows a caller-supplied message over the preset when both could apply", () => {
    identityValue = { isAuthenticated: false };
    renderWithRouter(
      <AuthGate reason="submit" message="Sign in to export this report.">
        x
      </AuthGate>
    );

    expect(screen.getByText("Sign in to export this report.")).toBeInTheDocument();
    expect(
      screen.queryByText("Create an account to submit solutions and save your progress.")
    ).not.toBeInTheDocument();
  });

  it("falls back to the default message for an unrecognized reason", () => {
    identityValue = { isAuthenticated: false };
    renderWithRouter(<AuthGate reason="not-a-real-reason">x</AuthGate>);

    expect(screen.getByText("Sign in to continue.")).toBeInTheDocument();
  });

  it("the Sign In link preserves the current page as ?next=", () => {
    identityValue = { isAuthenticated: false };
    renderWithRouter(<AuthGate reason="submit">x</AuthGate>, ["/problems/two-sum?tab=solutions"]);

    const link = screen.getByRole("link", { name: "Sign In" });
    expect(link.getAttribute("href")).toBe(
      "/login?next=%2Fproblems%2Ftwo-sum%3Ftab%3Dsolutions"
    );
  });

  it("inline mode renders the card without the full-height centering wrapper", () => {
    identityValue = { isAuthenticated: false };
    const { container } = renderWithRouter(
      <AuthGate reason="submit" inline>
        x
      </AuthGate>
    );

    expect(container.querySelector(".py-16")).not.toBeInTheDocument();
    expect(screen.getByText("Sign in required")).toBeInTheDocument();
  });

  it("AuthGateCard renders standalone with no identity check (click-triggered usage)", () => {
    renderWithRouter(<AuthGateCard reason="candidates" />);
    expect(screen.getByText("Sign in to access candidate profiles.")).toBeInTheDocument();
  });
});
