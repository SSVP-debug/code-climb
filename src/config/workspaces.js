/**
 * workspaces.js — single source of truth for the four Code Club
 * workspaces (Student / Recruiter / TPO / Admin). Used by Navbar's brand
 * label and by WorkspaceSwitcher so the label text, tagline, and
 * destination route can't drift apart between the two.
 *
 * Deliberately separate from src/config/site.js (domain/contact config)
 * — this is product-identity config, not deployment config.
 */
export const WORKSPACES = [
  { role: "student", label: "Student", tagline: "Coding & Growth", to: "/dashboard" },
  { role: "recruiter", label: "Recruiter", tagline: "Talent Intelligence", to: "/recruiter/dashboard" },
  { role: "tpo", label: "TPO", tagline: "College Intelligence", to: "/tpo/dashboard" },
  { role: "admin", label: "Command Center", tagline: "Platform Command Center", to: "/admin" },
];

export function getWorkspace(role) {
  return WORKSPACES.find((w) => w.role === role) ?? WORKSPACES[0];
}
