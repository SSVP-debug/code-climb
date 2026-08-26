// Content & Execution Architecture, Phase 2 — ProblemEditor's language
// <select> must render options from useLanguages() (backed by
// GET /api/languages) instead of a hardcoded set of four <option> tags.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ProblemEditor from "./ProblemEditor";

// Guest Mode integration: useLanguages.js now calls apiFetchOptional (not
// apiFetch) against GET /api/languages, since that route is genuinely
// public — see useLanguages.js's own comment. Mock target updated to
// match; ProblemEditor itself doesn't call the API directly, this only
// matters because useLanguages() is used underneath it.
const apiFetchOptional = vi.fn();
vi.mock("../../services/api", () => ({
  apiFetchOptional: (...args) => apiFetchOptional(...args),
}));

vi.mock("../../hooks/useTheme", () => ({
  useTheme: () => ({
    theme: {
      words: {
        language: "Language",
        run: "Run",
        running: "Running",
        submit: "Submit",
        submitting: "Submitting",
        advancedTesting: "Advanced Testing",
        customInput: "Custom Input",
        customInputPlaceholder: "Enter input...",
      },
    },
  }),
}));

// Monaco is heavy and irrelevant to what this test covers (the language
// <select>, which lives outside the editor itself) — stubbed to a plain
// textarea-like placeholder, same "stub the unrelated heavy child" idea
// as EducationSection.test.jsx stubbing out CollegeVerifyModal.
vi.mock("@monaco-editor/react", () => ({
  default: () => <div data-testid="monaco-editor-stub" />,
}));

function noop() {}

describe("ProblemEditor — language selector sourced from useLanguages()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the language options returned by GET /api/languages, not a hardcoded set", async () => {
    apiFetchOptional.mockResolvedValueOnce({
      languages: [
        { id: "python", name: "Python", extension: "py" },
        { id: "javascript", name: "JavaScript", extension: "js" },
      ],
    });

    render(
      <ProblemEditor
        slug="two-sum"
        language="python"
        setLanguage={noop}
        code=""
        setCode={noop}
        customInput=""
        setCustomInput={noop}
        onRun={noop}
        onSubmit={noop}
        onReset={noop}
        running={false}
        submitting={false}
      />
    );

    // Fallback options render first (synchronously) — see useLanguages.js.
    expect(screen.getByRole("option", { name: "Python" })).toBeInTheDocument();

    await screen.findByRole("option", { name: "JavaScript" });
    expect(screen.queryByRole("option", { name: "Java" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "C++" })).not.toBeInTheDocument();
  });
});
