// Central definition of the four "workspaces" a person can be in. Only
// admins get a switcher between them (see WorkspaceSwitcher.jsx) — it's
// the one role with a genuine concept of stepping into another role's
// view. Everyone else has exactly one workspace and no switcher.
export const WORKSPACES = [
  { id: "admin", label: "Command Center", path: "/admin" },
  { id: "student", label: "Student", path: "/dashboard" },
  { id: "recruiter", label: "Recruiter", path: "/recruiter/dashboard" },
  { id: "tpo", label: "TPO", path: "/tpo/dashboard" },
];
