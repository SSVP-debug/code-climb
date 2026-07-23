/**
 * Frontend feature flags — Code Club
 *
 * WORKSPACE_V2_ENABLED gates the Understand → Build → Validate problem
 * workspace redesign (the Stage-1 reading overlay + progressive testcase
 * reveal, in ProblemWorkspaceLayout/useWorkspaceStage). Mirrors the
 * backend's MONETIZATION_ENABLED/B2B_ENABLED pattern on purpose: fully
 * built, default OFF, flipped with an env var — zero extra deploys needed
 * to roll it out, and one env var flip to roll it back if something's
 * wrong in production.
 *
 * Flag OFF reproduces the exact pre-redesign behavior (workspace panel
 * always visible, no overlay) — it does NOT fall back to the old deleted
 * ProblemSolverDesktopView/MobileView components. There's still exactly
 * one workspace component; the flag only changes what it does internally.
 * See ProblemWorkspaceLayout.jsx for where this is consumed.
 *
 * A `?ff=workspaceV2:1` URL override (persisted to localStorage) is also
 * supported, so you can preview the new workspace in production without a
 * separate deploy per test — there are no other users on this product yet,
 * so this is safe to leave in. `?ff=workspaceV2:0` clears it back off.
 */
const OVERRIDE_STORAGE_KEY = "cc_feature_overrides";

function readOverrides() {
  try {
    return JSON.parse(localStorage.getItem(OVERRIDE_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function applyUrlOverride() {
  if (typeof window === "undefined") return;
  const raw = new URLSearchParams(window.location.search).get("ff");
  if (!raw) return;
  const [name, value] = raw.split(":");
  if (!name) return;
  const overrides = readOverrides();
  overrides[name] = value !== "0";
  try {
    localStorage.setItem(OVERRIDE_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // localStorage unavailable (private mode, etc.) — override just won't
    // persist across navigations. Not worth failing the page load over.
  }
}

applyUrlOverride();

function isEnabled(name, envDefault) {
  const overrides = readOverrides();
  return name in overrides ? overrides[name] : envDefault;
}

export const WORKSPACE_V2_ENABLED = isEnabled(
  "workspaceV2",
  import.meta.env.VITE_WORKSPACE_V2_ENABLED === "true"
);