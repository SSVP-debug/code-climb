import { Link } from "react-router-dom";
import { Terminal, Target, Building2 } from "lucide-react";

const VIEW_AS = [
  {
    id: "student",
    label: "Student",
    accent: "border-green-500/30 hover:border-green-500/60",
    icon: Terminal,
    pages: [{ label: "Dashboard", path: "/dashboard" }],
  },
  {
    id: "recruiter",
    label: "Recruiter",
    accent: "border-sky-500/30 hover:border-sky-500/60",
    icon: Target,
    pages: [
      { label: "Candidates", path: "/recruiter/dashboard?tab=candidates" },
      { label: "Sent Tests", path: "/recruiter/dashboard?tab=tests" },
    ],
  },
  {
    id: "tpo",
    label: "TPO",
    accent: "border-violet-500/30 hover:border-violet-500/60",
    icon: Building2,
    pages: [
      { label: "Overview", path: "/tpo/dashboard?tab=overview" },
      { label: "Students", path: "/tpo/dashboard?tab=students" },
      { label: "Assignments", path: "/tpo/dashboard?tab=assignments" },
    ],
  },
];

function ViewAsSection() {
  return (
    <section className="mb-10">
      <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-3">
        View as
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {VIEW_AS.map((v) => (
          <div
            key={v.id}
            className={`bg-zinc-900/60 border rounded-xl px-4 py-3 transition ${v.accent}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl" aria-hidden="true"><v.icon size={22} strokeWidth={1.75} /></span>
              <p className="text-white text-sm font-semibold">{v.label} portal</p>
            </div>
            <div className="flex flex-col gap-1.5">
              {v.pages.map((p) => (
                <Link
                  key={p.path}
                  to={p.path}
                  className="text-xs font-mono text-zinc-400 hover:text-white bg-black/30 hover:bg-black/50 rounded-lg px-2.5 py-1.5 transition"
                >
                  {p.label} →
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-zinc-600 text-xs mt-2">
        These are your real live dashboards — an admin badge follows you so you can jump back here anytime.
      </p>
    </section>
  );
}

export default ViewAsSection;