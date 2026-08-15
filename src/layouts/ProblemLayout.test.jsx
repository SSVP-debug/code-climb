import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../context/AuthContextObject";
import ProblemLayout from "./ProblemLayout";

// Navbar transformation, Phase B. Prior to this file, ProblemLayout had no
// direct test coverage. Covers what actually changed: the "Code Club" mark
// now present in the topbar, and that prev/next respect null slugs (the
// aria-disabled contract ProblemWorkspaceLayout relies on).
function renderProblemLayout({ user = { displayName: "Test User" }, ...props }) {
  return render(
    <AuthContext.Provider value={{ user, loading: false }}>
      <MemoryRouter>
        <ProblemLayout title="Two Sum" prevSlug={null} nextSlug="valid-parentheses" {...props}>
          <div>solver content</div>
        </ProblemLayout>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("ProblemLayout", () => {
  it("shows the Code Club mark so the page doesn't feel like a separate site", () => {
    renderProblemLayout({});
    expect(screen.getByText("Code Club")).toBeInTheDocument();
  });

  it("shows the problem title and a back link to /problems", () => {
    renderProblemLayout({});
    expect(screen.getByText("Two Sum")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /problems/i })).toHaveAttribute("href", "/problems");
  });

  it("disables the previous-problem link when there is no prevSlug", () => {
    renderProblemLayout({});
    const prevLink = screen.getByTitle("Previous problem");
    expect(prevLink).toHaveAttribute("aria-disabled", "true");
  });

  it("enables the next-problem link when a nextSlug is present", () => {
    renderProblemLayout({});
    const nextLink = screen.getByTitle("Next problem");
    expect(nextLink).toHaveAttribute("href", "/problems/valid-parentheses");
    expect(nextLink).toHaveAttribute("aria-disabled", "false");
  });

  it("renders the workspace children", () => {
    renderProblemLayout({});
    expect(screen.getByText("solver content")).toBeInTheDocument();
  });
});
