// Content & Execution Architecture, Phase 2 — the frontend must discover
// enabled languages from GET /api/languages instead of hardcoding a list.
// Mocking convention mirrors src/components/profile/EducationSection.test.jsx.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useLanguages } from "./useLanguages";

// Guest Mode integration: useLanguages.js now calls apiFetchOptional (not
// apiFetch) against GET /api/languages, since that route is genuinely
// public and apiFetch throws immediately for a caller with no Firebase
// user — see useLanguages.js's own comment. Mock target updated to match.
const apiFetchOptional = vi.fn();
vi.mock("../services/api", () => ({
  apiFetchOptional: (...args) => apiFetchOptional(...args),
}));

describe("useLanguages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the static fallback synchronously, before the fetch resolves", () => {
    apiFetchOptional.mockReturnValueOnce(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useLanguages());

    expect(result.current.languages.map((l) => l.id)).toEqual([
      "python",
      "javascript",
      "java",
      "cpp",
    ]);
    expect(result.current.loading).toBe(true);
  });

  it("replaces the fallback with the backend's enabled-language list once GET /api/languages resolves", async () => {
    apiFetchOptional.mockResolvedValueOnce({
      languages: [
        { id: "python", name: "Python", extension: "py" },
        { id: "javascript", name: "JavaScript", extension: "js" },
      ],
    });

    const { result } = renderHook(() => useLanguages());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.languages).toEqual([
      { id: "python", name: "Python", extension: "py" },
      { id: "javascript", name: "JavaScript", extension: "js" },
    ]);
    expect(apiFetchOptional).toHaveBeenCalledWith("/api/languages");
  });

  it("keeps the static fallback if the API call fails entirely (offline/backend down)", async () => {
    apiFetchOptional.mockRejectedValueOnce(new Error("network error"));

    const { result } = renderHook(() => useLanguages());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.languages.map((l) => l.id)).toEqual([
      "python",
      "javascript",
      "java",
      "cpp",
    ]);
  });

  it("keeps the static fallback if the API responds with an empty languages array (never renders a zero-option selector)", async () => {
    apiFetchOptional.mockResolvedValueOnce({ languages: [] });

    const { result } = renderHook(() => useLanguages());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.languages.length).toBeGreaterThan(0);
  });
});
