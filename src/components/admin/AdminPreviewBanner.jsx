import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppContext } from "../../hooks/useAppContext";
import { apiFetch } from "../../services/api";
import { AlertTriangle, Shield } from "lucide-react";

const VIEW_TARGETS = [
  { label: "Student", path: "/dashboard" },
  { label: "Recruiter", path: "/recruiter/dashboard" },
  { label: "TPO", path: "/tpo/dashboard" },
];

/**
 * AdminPreviewBanner — God Mode, always-visible strip.
 *
 * Mounted once at the top of App.jsx, above <Routes>, so it persists
 * across navigation instead of being re-implemented per dashboard page.
 *
 * Two states, both driven by AppContext (sourced from /api/init):
 *   - impersonation.active — an admin is currently viewing as a real user
 *     via "Login As". Shows who, with an Exit action.
 *   - role === "admin" (and not impersonating) — the plain God Mode strip
 *     with quick jumps into your own live dashboards + the console.
 * Renders nothing for anyone else.
 */
export default function AdminPreviewBanner() {
  const { role, impersonation } = useAppContext();
  const location = useLocation();
  const [exiting, setExiting] = useState(false);

  async function exitImpersonation() {
    setExiting(true);
    try {
      await apiFetch("/api/admin/impersonate/stop", { method: "POST" });
    } catch {
      // fall through to reload regardless — worst case they land back on
      // /admin still impersonating and can hit Exit again.
    }
    // Full reload, not client-side navigate: AppContext holds a lot of
    // per-identity state (XP, submissions, solved problems, …) that all
    // needs a clean refetch for whichever identity is active next.
    window.location.href = "/admin";
  }

  if (impersonation?.active) {
    return (
      <div className="sticky top-0 z-[70] bg-amber-950 border-b border-amber-700/60 text-amber-200">
        <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center justify-between gap-3 flex-wrap text-xs">
          <span className="font-semibold tracking-wide whitespace-nowrap inline-flex items-center gap-1.5">
            <AlertTriangle size={13} strokeWidth={2} aria-hidden="true" />
            Impersonating {impersonation.targetDisplayName || impersonation.targetEmail}{" "}
            <span className="font-normal text-amber-400">({impersonation.targetRole})</span>
          </span>
          <button
            onClick={exitImpersonation}
            disabled={exiting}
            className="px-2.5 py-1 rounded-md bg-amber-800/60 hover:bg-amber-800 transition disabled:opacity-60"
          >
            {exiting ? "Exiting…" : "Exit Impersonation"}
          </button>
        </div>
      </div>
    );
  }

  if (role !== "admin") return null;

  return (
    <div className="sticky top-0 z-[70] bg-violet-950 border-b border-violet-800/60 text-violet-200">
      <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center justify-between gap-3 flex-wrap text-xs">
        <span className="font-semibold tracking-wide whitespace-nowrap inline-flex items-center gap-1.5">
          <Shield size={13} strokeWidth={2} aria-hidden="true" />
          Admin Preview
        </span>
        <div className="flex items-center gap-1 flex-wrap">
          {VIEW_TARGETS.map((t) => (
            <Link
              key={t.path}
              to={t.path}
              className={`px-2.5 py-1 rounded-md transition ${
                location.pathname === t.path
                  ? "bg-violet-700 text-white"
                  : "hover:bg-violet-900 text-violet-300"
              }`}
            >
              {t.label}
            </Link>
          ))}
          <Link
            to="/admin"
            className={`px-2.5 py-1 rounded-md transition border-l border-violet-800 ml-1 pl-3 ${
              location.pathname === "/admin"
                ? "bg-violet-700 text-white"
                : "hover:bg-violet-900 text-violet-300"
            }`}
          >
            Console
          </Link>
        </div>
      </div>
    </div>
  );
}