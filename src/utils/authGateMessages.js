// Split out of AuthGate.jsx: that file's fast-refresh boundary only tolerates
// component exports (react-refresh/only-export-components) — a plain object
// export alongside AuthGate/AuthGateCard broke that. Imported by both
// AuthGate.jsx (component) and pages/LoginPage.jsx (guest-gate banner).
export const AUTH_GATE_MESSAGES = {
  progress: "Create an account to save your progress.",
  submit: "Create an account to submit solutions and save your progress.",
  candidates: "Sign in to access candidate profiles.",
  studentData: "Sign in to access student and college data.",
  default: "Sign in to continue.",
};
