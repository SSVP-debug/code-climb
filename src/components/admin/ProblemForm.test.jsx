// Content & Execution Architecture cross-check follow-up (Phase 6): this
// form used to hardcode `const LANGUAGES = ["python", "javascript",
// "java", "cpp"]`, meaning an admin creating a NEW problem had no way to
// enter starter code for any language added after those original four —
// even once a new language was fully registered and enabled. No test
// existed to catch this (this is the file's first test coverage at all).
// Mocking convention mirrors ProblemEditor.test.jsx's useLanguages() mock.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProblemForm from "./ProblemForm";

const apiFetchOptional = vi.fn();
vi.mock("../../services/api", () => ({
  apiFetchOptional: (...args) => apiFetchOptional(...args),
}));

function noop() {}

describe("ProblemForm — starter-code language fields sourced from useLanguages()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("grows to include a newly-enabled language once GET /api/languages resolves, not a hardcoded set of four", async () => {
    apiFetchOptional.mockResolvedValueOnce({
      languages: [
        { id: "python", name: "Python", extension: "py" },
        { id: "javascript", name: "JavaScript", extension: "js" },
        { id: "java", name: "Java", extension: "java" },
        { id: "cpp", name: "C++", extension: "cpp" },
        { id: "typescript", name: "TypeScript", extension: "ts" },
      ],
    });

    render(<ProblemForm mode="create" initialProblem={null} onSubmit={noop} onCancel={noop} saving={false} />);

    // Fallback (python/javascript/java/cpp) renders first, synchronously —
    // matches useLanguages()'s own documented behavior.
    expect(screen.getByText("python")).toBeInTheDocument();
    expect(screen.queryByText("typescript")).not.toBeInTheDocument();

    // Once GET /api/languages resolves, the field set grows to include
    // it — this is the actual regression test: "typescript" only ever
    // appears here because it's now derived, not hardcoded to a fixed
    // set of four.
    await screen.findByText("typescript");
    expect(screen.getByText("javascript")).toBeInTheDocument();
    expect(screen.getByText("java")).toBeInTheDocument();
    expect(screen.getByText("cpp")).toBeInTheDocument();
  });

  it("still shows a language's starter code on an existing problem even if that language was since disabled", async () => {
    apiFetchOptional.mockResolvedValueOnce({
      languages: [{ id: "python", name: "Python", extension: "py" }],
    });

    const problem = {
      title: "Old Problem",
      slug: "old-problem",
      adminSource: "admin",
      starterCode: { python: "def f(): pass", cobol: "* a starter written before cobol was disabled" },
    };

    render(<ProblemForm mode="edit" initialProblem={problem} onSubmit={noop} onCancel={noop} saving={false} />);

    await screen.findByText("python");
    // "cobol" isn't in the currently-enabled list at all, but its
    // historical starter code must still be visible/editable — same
    // posture Submission.js already takes toward disabled languages
    // (SUPPORTED, not ENABLED, governs what's visible for existing
    // content).
    expect(screen.getByText("cobol")).toBeInTheDocument();
    expect(screen.getByDisplayValue("* a starter written before cobol was disabled")).toBeInTheDocument();
  });

  it("updates the right starter-code key when typing into a dynamically-rendered language field", async () => {
    apiFetchOptional.mockResolvedValueOnce({
      languages: [{ id: "typescript", name: "TypeScript", extension: "ts" }],
    });

    render(<ProblemForm mode="create" initialProblem={null} onSubmit={noop} onCancel={noop} saving={false} />);

    const label = await screen.findByText("typescript");
    const textarea = label.nextElementSibling;

    fireEvent.change(textarea, { target: { value: "function f() {}" } });

    expect(textarea.value).toBe("function f() {}");
  });
});