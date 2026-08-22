import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RoleAccountView from "./RoleAccountView";

function renderView(overrides = {}) {
  const user = { displayName: "Priya Sharma", email: "priya@college.edu", ...overrides.user };
  const switchActiveRole = overrides.switchActiveRole ?? vi.fn().mockResolvedValue({});

  render(
    <MemoryRouter>
      <RoleAccountView
        role={overrides.role ?? "tpo"}
        user={user}
        joinedDisplay={overrides.joinedDisplay ?? "Feb 11, 2024"}
        roles={overrides.roles ?? ["student", "tpo"]}
        switchActiveRole={switchActiveRole}
        tpoProfile={overrides.tpoProfile}
        recruiterProfile={overrides.recruiterProfile}
      />
    </MemoryRouter>
  );

  return { switchActiveRole };
}

// Role/profile isolation fix: this is what Profile.jsx now renders for a
// TPO or Recruiter session instead of falling through into the
// student-shaped hero (XP/streak/solved tiles), which is where a TPO
// could previously see a leftover Student registration's progress data.
// See models/User.js's role/roles comment (backend) for the root cause.
describe("RoleAccountView", () => {
  it("shows identity, the role badge, and join date for a TPO session", () => {
    renderView({ role: "tpo", roles: ["tpo"] });

    expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
    expect(screen.getByText("priya@college.edu")).toBeInTheDocument();
    expect(screen.getByText("TPO")).toBeInTheDocument();
    expect(screen.getByText("Joined Feb 11, 2024")).toBeInTheDocument();
  });

  it("shows identity and the role badge for a Recruiter session", () => {
    renderView({ role: "recruiter", roles: ["recruiter"] });

    expect(screen.getByText("Recruiter")).toBeInTheDocument();
  });

  it("links to the TPO dashboard for a tpo session, and recruiter dashboard for a recruiter session", () => {
    renderView({ role: "tpo", roles: ["tpo"] });
    expect(screen.getByRole("link", { name: /open tpo dashboard/i })).toHaveAttribute(
      "href",
      "/tpo/dashboard"
    );

    renderView({ role: "recruiter", roles: ["recruiter"] });
    expect(screen.getByRole("link", { name: /open recruiter dashboard/i })).toHaveAttribute(
      "href",
      "/recruiter/dashboard"
    );
  });

  it(
    "REGRESSION: never renders XP/streak/solved stat tiles — the exact leak this " +
      "component exists to prevent",
    () => {
      renderView();

      expect(screen.queryByText("Total XP")).not.toBeInTheDocument();
      expect(screen.queryByText("Current Streak")).not.toBeInTheDocument();
      expect(screen.queryByText(/solved problems/i)).not.toBeInTheDocument();
    }
  );

  it("shows the college name and verification status from tpoProfile when present", () => {
    renderView({
      role: "tpo",
      roles: ["tpo"],
      tpoProfile: { collegeName: "IIT Bombay", verified: true },
    });

    expect(screen.getByText("IIT Bombay · Verified")).toBeInTheDocument();
  });

  it("shows the company name and pending status from recruiterProfile when present", () => {
    renderView({
      role: "recruiter",
      roles: ["recruiter"],
      recruiterProfile: { companyName: "Acme Corp", verified: false },
    });

    expect(screen.getByText("Acme Corp · Verification pending")).toBeInTheDocument();
  });

  it("offers no role-switch affordance for a single-role account", () => {
    renderView({ role: "tpo", roles: ["tpo"] });
    expect(screen.queryByText(/also authorized for/i)).not.toBeInTheDocument();
  });

  it(
    "offers a switch button for each OTHER authorized role on a multi-role account, " +
      "and calls switchActiveRole with the target when clicked",
    async () => {
      const { switchActiveRole } = renderView({ role: "tpo", roles: ["student", "tpo", "recruiter"] });

      expect(screen.getByText(/also authorized for student, recruiter/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Switch to Student" }));
      await waitFor(() => expect(switchActiveRole).toHaveBeenCalledWith("student"));

      fireEvent.click(screen.getByRole("button", { name: "Switch to Recruiter" }));
      await waitFor(() => expect(switchActiveRole).toHaveBeenCalledWith("recruiter"));

      // The currently-active role itself is never offered as a switch target.
      expect(screen.queryByRole("button", { name: "Switch to TPO" })).not.toBeInTheDocument();
    }
  );

  it("shows an error message if switching roles fails, without crashing", async () => {
    const switchActiveRole = vi.fn().mockRejectedValue(new Error("network error"));
    renderView({ role: "tpo", roles: ["student", "tpo"], switchActiveRole });

    fireEvent.click(screen.getByRole("button", { name: "Switch to Student" }));

    await waitFor(() =>
      expect(screen.getByText(/couldn't switch roles/i)).toBeInTheDocument()
    );
  });

  it("falls back to an initial avatar when there's no photoURL", () => {
    renderView({ user: { displayName: "Priya Sharma", email: "priya@college.edu" } });
    expect(screen.getByText("P")).toBeInTheDocument();
  });

  it("returns null for an unrecognized role (defensive — Profile.jsx only renders this for tpo/recruiter)", () => {
    const { container } = render(
      <MemoryRouter>
        <RoleAccountView
          role="student"
          user={{ displayName: "X", email: "x@test.com" }}
          joinedDisplay="Jan 1, 2024"
          roles={["student"]}
          switchActiveRole={vi.fn()}
        />
      </MemoryRouter>
    );
    expect(container).toBeEmptyDOMElement();
  });
});
