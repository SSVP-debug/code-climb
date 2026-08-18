import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminAccountView from "./AdminAccountView";

function renderView(overrides = {}) {
  const user = { displayName: "Priya Sharma", email: "priya@codeclub.dev", ...overrides.user };
  render(
    <MemoryRouter>
      <AdminAccountView user={user} joinedDisplay={overrides.joinedDisplay ?? "Feb 11, 2024"} />
    </MemoryRouter>
  );
}

// Admin UX audit (Phase UI-3, P0/P1): locks in that admin gets a minimal,
// non-gamified identity view — name, email, "Administrator" badge, join
// date, and a way back to the Console — with none of the student-only
// concepts (XP, streak, resume prompts, achievements) that Profile.jsx's
// full render assumes.
describe("AdminAccountView", () => {
  it("shows identity, the Administrator badge, and join date", () => {
    renderView();

    expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
    expect(screen.getByText("priya@codeclub.dev")).toBeInTheDocument();
    expect(screen.getByText("Administrator")).toBeInTheDocument();
    expect(screen.getByText("Joined Feb 11, 2024")).toBeInTheDocument();
  });

  it("links back to the Admin Console and to account settings", () => {
    renderView();

    expect(screen.getByRole("link", { name: /open admin console/i })).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("link", { name: /account settings/i })).toHaveAttribute("href", "/settings");
  });

  it("doesn't render XP/streak/solved stat tiles or an achievements gallery", () => {
    renderView();

    // The explanatory copy below is allowed to name these concepts (it's
    // telling the admin they don't apply); what must not exist is the
    // student page's actual stat tiles/gallery UI for them.
    expect(screen.queryByText("Total XP")).not.toBeInTheDocument();
    expect(screen.queryByText("Current Streak")).not.toBeInTheDocument();
    expect(screen.queryByText(/no achievements unlocked/i)).not.toBeInTheDocument();
  });

  it("falls back to an initial avatar when there's no photoURL", () => {
    renderView({ user: { displayName: "Priya Sharma", email: "priya@codeclub.dev" } });

    expect(screen.getByText("P")).toBeInTheDocument();
  });
});