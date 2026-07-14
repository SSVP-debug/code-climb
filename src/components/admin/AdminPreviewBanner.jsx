import { Link, useLocation } from "react-router-dom";
import { useAppContext } from "../../hooks/useAppContext";

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
 * Renders nothing unless the signed-in account's real role (from
 * AppContext, sourced from /api/init) is "admin" — never based on which
 * dashboard is currently open, so it can't be spoofed by URL alone.
 */
export default function AdminPreviewBanner() {
  const { role } = useAppContext();
  const location = useLocation();

  if (role !== "admin") return null;

  return (
    <div className="sticky top-0 z-[70] bg-violet-950 border-b border-violet-800/60 text-violet-200">
      <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center justify-between gap-3 flex-wrap text-xs">
        <span className="font-semibold tracking-wide whitespace-nowrap">
          🛡️ Admin Preview
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