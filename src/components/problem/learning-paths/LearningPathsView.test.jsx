import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LearningPathsView from "./LearningPathsView";

vi.mock("../../../hooks/useHideDifficultyLabels", () => ({
  useHideDifficultyLabels: () => false,
}));

vi.mock("../../../context/authContext", () => ({
  useAuth: () => ({ user: { uid: "test-user" } }),
}));

// Three tiny fake problems, one per real learningPaths.js path id, so the
// slug-join in useLearningPaths resolves to exactly one problem per path
// regardless of the real curated lists (keeps this test independent of
// whatever the current curation happens to contain).
vi.mock("../../../data/learningPaths", () => ({
  default: [
    {
      id: "beginner",
      name: "Beginner",
      tagline: "Fundamentals.",
      difficulty: "Beginner",
      color: "teal",
      icon: "Sprout",
      estimatedTime: { low: 1, high: 2, unit: "hours" },
      problemSlugs: ["fake-easy"],
    },
    {
      id: "intermediate",
      name: "Intermediate",
      tagline: "Level up.",
      difficulty: "Intermediate",
      color: "amber",
      icon: "Zap",
      estimatedTime: { low: 3, high: 4, unit: "hours" },
      problemSlugs: ["fake-medium"],
    },
  ],
}));

const fakeProblems = [
  { slug: "fake-easy", title: "Fake Easy Problem", difficulty: "Easy" },
  { slug: "fake-medium", title: "Fake Medium Problem", difficulty: "Medium" },
];

function renderView(solvedProblems = []) {
  return render(
    <MemoryRouter>
      <LearningPathsView problems={fakeProblems} solvedProblems={solvedProblems} />
    </MemoryRouter>
  );
}

beforeEach(() => {
  sessionStorage.clear();
});

// The card's own title ("Beginner") and its path-level difficulty badge
// ("Beginner") render the same literal text, so a plain getByText("Beginner")
// is ambiguous. Query by the card's accessible name (its full button text)
// instead, which is unique per card.
function getPathCard(name) {
  return screen.getByRole("button", { name: new RegExp(name) });
}

describe("LearningPathsView", () => {
  it("renders one card per path in the list view", () => {
    renderView();
    expect(getPathCard("Beginner")).toBeInTheDocument();
    expect(getPathCard("Intermediate")).toBeInTheDocument();
  });

  it("opens a path's detail view when its card is clicked, and shows its problem", () => {
    renderView();
    fireEvent.click(getPathCard("Beginner"));
    expect(screen.getByText("Fake Easy Problem")).toBeInTheDocument();
    expect(screen.getByText("Back to Learning Paths")).toBeInTheDocument();
  });

  it("persists the selected path to sessionStorage, and a fresh mount reopens it directly", () => {
    const { unmount } = renderView();
    fireEvent.click(getPathCard("Beginner"));
    expect(sessionStorage.getItem("cc_learningPathId")).toBe("beginner");

    // Simulate ProblemsPage unmounting (navigating to /problems/:slug)
    // and remounting (navigating back) — this is the regression test for
    // the requirement in plans/001-learning-paths.md §3/§8 edge case 5.
    unmount();
    renderView();

    expect(screen.getByText("Fake Easy Problem")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Intermediate/ })).not.toBeInTheDocument();
  });

  it("clears the stored path id when navigating back to the list", () => {
    renderView();
    fireEvent.click(getPathCard("Beginner"));
    fireEvent.click(screen.getByText("Back to Learning Paths"));

    expect(sessionStorage.getItem("cc_learningPathId")).toBeNull();
    expect(getPathCard("Intermediate")).toBeInTheDocument();
  });
});
