import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import { AppContext } from "../context/AppContextObject";
import ThemeGate from "./ThemeGate";

// themeId comes from localStorage (see utils/themeStorage.js) — cleared
// before each test so every case starts from "no theme selected".
beforeEach(() => {
  localStorage.clear();
});

function renderGate({ role, isBackendReady }) {
  const appContextValue = { role, isBackendReady };
  return render(
    <AppContext.Provider value={appContextValue}>
      <ThemeProvider>
        <MemoryRouter initialEntries={["/protected"]}>
          <Routes>
            <Route
              path="/protected"
              element={<ThemeGate><div>Protected content</div></ThemeGate>}
            />
            <Route path="/theme-selection" element={<div>Theme selection page</div>} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </AppContext.Provider>
  );
}

describe("ThemeGate", () => {
  it("redirects a themeless student to /theme-selection", () => {
    renderGate({ role: "student", isBackendReady: true });
    expect(screen.getByText("Theme selection page")).toBeInTheDocument();
  });

  it("lets a themeless recruiter straight through — no theme onboarding exists for this role", () => {
    renderGate({ role: "recruiter", isBackendReady: true });
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("lets a themeless TPO straight through", () => {
    renderGate({ role: "tpo", isBackendReady: true });
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("lets a themeless admin straight through", () => {
    renderGate({ role: "admin", isBackendReady: true });
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("does not bypass on the role's default value before the backend hydrate resolves", () => {
    // role defaults to "student" pre-hydrate even for a real recruiter
    // (see appContext.jsx) — isBackendReady=false must still gate on the
    // themeless-student path rather than reading the not-yet-correct role.
    renderGate({ role: "student", isBackendReady: false });
    expect(screen.getByText("Theme selection page")).toBeInTheDocument();
  });
});