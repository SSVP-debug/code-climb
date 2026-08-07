import { Users, Briefcase, GraduationCap, UserPlus, ListChecks, CheckCircle2, Percent, Clock } from "lucide-react";
import { useAdminDashboardMetrics } from "../../hooks/useAdminDashboardMetrics";

/**
 * DashboardMetricsSection — plan 004's operational snapshot, a responsive
 * grid of stat cards fed by a single GET /api/admin/dashboard-metrics
 * response. Structured as METRIC_GROUPS.map(...) over a config array (per
 * plan 004 step 4) so a future metric is "add one more entry fed by one
 * more response field," not new JSX — same one-array-drives-render
 * convention as VerificationQueueSection/UserActionsMenu's ROLE_OPTIONS.
 *
 * "Pending approvals" cards double as quick-links (plan 004 step 5) —
 * this page IS /admin, and the verification queues render further down
 * this same page (see AdminOverviewPage.jsx), so these just anchor-scroll
 * rather than navigate anywhere.
 */
const METRIC_GROUPS = [
  {
    heading: "Users",
    cards: [
      { key: "totalStudents", label: "Total Students", icon: GraduationCap, group: "users" },
      { key: "activeStudents", label: "Active Students", icon: GraduationCap, group: "users" },
      { key: "totalRecruiters", label: "Total Recruiters", icon: Briefcase, group: "users" },
      { key: "activeRecruiters", label: "Active Recruiters", icon: Briefcase, group: "users" },
      { key: "totalTpos", label: "Total TPOs", icon: Users, group: "users" },
      { key: "activeTpos", label: "Active TPOs", icon: Users, group: "users" },
      { key: "newRegistrationsToday", label: "New Registrations Today", icon: UserPlus, group: "users" },
    ],
  },
  {
    heading: "Content",
    cards: [
      { key: "totalProblems", label: "Total Problems", icon: ListChecks, group: "content" },
      { key: "totalSubmissions", label: "Total Submissions", icon: CheckCircle2, group: "content" },
      { key: "acceptanceRate", label: "Acceptance Rate", icon: Percent, group: "content", suffix: "%" },
    ],
  },
  {
    heading: "Pending approvals",
    cards: [
      {
        key: "pendingRecruiterApprovals",
        label: "Pending Recruiter Approvals",
        icon: Clock,
        group: "approvals",
        anchor: "#recruiter-queue",
      },
      {
        key: "pendingTpoApprovals",
        label: "Pending TPO Approvals",
        icon: Clock,
        group: "approvals",
        anchor: "#tpo-queue",
      },
    ],
  },
];

function StatCard({ label, icon: Icon, value, suffix, anchor }) {
  const content = (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 hover:border-zinc-700 transition h-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-zinc-500 text-xs uppercase tracking-wide">{label}</span>
        <Icon size={14} className="text-zinc-600" />
      </div>
      <p className="text-white text-2xl font-black">
        {value}
        {suffix || ""}
      </p>
    </div>
  );

  return anchor ? (
    <a href={anchor} className="block">
      {content}
    </a>
  ) : (
    content
  );
}

function DashboardMetricsSection() {
  const { metrics, loading } = useAdminDashboardMetrics();

  return (
    <section className="mb-10">
      {METRIC_GROUPS.map(({ heading, cards }) => (
        <div key={heading} className="mb-6">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-3">{heading}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {cards.map(({ key, label, icon, group, suffix, anchor }) => (
              <StatCard
                key={key}
                label={label}
                icon={icon}
                suffix={suffix}
                anchor={anchor}
                // Loading and zero both render as "0", not undefined/NaN,
                // per plan 004's done criteria ("sane even with zero data").
                value={loading ? "0" : metrics?.[group]?.[key] ?? 0}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export default DashboardMetricsSection;