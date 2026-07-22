import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RecruiterDashboardPage from "./RecruiterDashboardPage";

const apiFetch = vi.fn();
vi.mock("../services/api", () => ({
  apiFetch: (...args) => apiFetch(...args),
}));

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/recruiter/dashboard"]}>
      <RecruiterDashboardPage />
    </MemoryRouter>
  );
}

function lastQueryString() {
  const url = apiFetch.mock.calls[apiFetch.mock.calls.length - 1][0];
  return new URLSearchParams(url.split("?")[1] || "");
}

describe("RecruiterDashboardPage filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiFetch.mockResolvedValue({ candidates: [], total: 0 });
  });

  it("does not include preferredRole/availableForWork on the initial load (both unset)", async () => {
    renderPage();
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());

    const q = lastQueryString();
    expect(q.has("preferredRole")).toBe(false);
    expect(q.has("availableForWork")).toBe(false);
  });

  it("includes preferredRole in the query once selected and Search is clicked", async () => {
    renderPage();
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());

    fireEvent.change(screen.getByDisplayValue("Any role"), { target: { value: "Backend" } });
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() => {
      expect(lastQueryString().get("preferredRole")).toBe("Backend");
    });
  });

  it("includes availableForWork=true once the checkbox is checked and Search is clicked", async () => {
    renderPage();
    await waitFor(() => expect(apiFetch).toHaveBeenCalled());

    fireEvent.click(screen.getByLabelText(/available now/i));
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(() => {
      expect(lastQueryString().get("availableForWork")).toBe("true");
    });
  });
});