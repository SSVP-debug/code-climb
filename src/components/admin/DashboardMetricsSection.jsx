import {
  Users,
  Briefcase,
  GraduationCap,
  UserPlus,
  ListChecks,
  CheckCircle2,
  Percent,
  Clock,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useAdminDashboardMetrics } from "../../hooks/useAdminDashboardMetrics";

/**
 * DashboardMetricsSection — plan 004's operational snapshot, fed by a
 * single GET /api/admin/dashboard-metrics response.
 *
 * Data-contract fix (Command Center audit): the previous version rendered
 * "0" for both a genuine zero AND an unreachable API
 * (`loading ? "0" : metrics?.[group]?.[key] ?? 0`) — exactly the failure
 * mode this admin console is built to avoid everywhere else (see
 * AdminSystemHealthPage.jsx's "Couldn't load…" state for the pattern this
 * now follows). Three states are now visually distinct:
 *   loading → pulsing skeleton, no number at all
 *   error   → "—" plus a visible warning marker, never a bare zero
 *   loaded  → the real number, including a real zero
 *
 * Hierarchy (spec §6, "don't turn this into a wall of cards"): four
 * primary numbers an admin actually operates from get a taller, bolder
 * "hero" treatment; the rest of the breakdown sits in a denser secondary
 * row underneath. Pending approvals render as small actionable chips
 * (anchor-linking to the queues further down this same page) rather than
 * competing with the hero row for visual weight.
 */
const HERO_METRICS = [
  { key: "totalStudents", group: "users", label: "Total Students", icon: GraduationCap },
  { key: "totalSubmissions", group: "content", label: "Submissions", icon: CheckCircle2 },
  { key: "acceptanceRate", group: "content", label: "Acceptance Rate", icon: Percent, suffix: "%" },
  { key: "newRegistrationsToday", group: "users", label: "New Today", icon: UserPlus },
];

const SECONDARY_METRICS = [
  { key: "activeStudents", group: "users", label: "Active Students", icon: GraduationCap },
  { key: "totalRecruiters", group: "users", label: "Total Recruiters", icon: Briefcase },
  { key: "activeRecruiters", group: "users", label: "Active Recruiters", icon: Briefcase },
  { key: "totalTpos", group: "users", label: "Total TPOs", icon: Users },
  { key: "activeTpos", group: "users", label: "Active TPOs", icon: Users },
  { key: "totalProblems", group: "content", label: "Total Problems", icon: ListChecks },
];

const APPROVAL_CHIPS = [
  { key: "pendingRecruiterApprovals", group: "approvals", label: "recruiter approvals", anchor: "#recruiter-queue" },
  { key: "pendingTpoApprovals", group: "approvals", label: "TPO approvals", anchor: "#tpo-queue" },
];

function readValue(metrics, group, key) {
  return metrics?.[group]?.[key];
}

function CardShell({ anchor, tone, children, className = "" }) {
  const toneRing = tone === "error" ? "hover:border-verdict-reject/40" : "hover:border-zinc-700";
  const cls = `bg-zinc-900/60 border border-zinc-800 rounded-xl transition h-full ${toneRing} ${className}`;
  return anchor ? (
    <a href={anchor} className={`block ${cls}`}>
      {children}
    </a>
  ) : (
    <div className={cls}>{children}</div>
  );
}

function HeroStat({ label, icon: Icon, value, suffix, loading, failed }) {
  return (
    <CardShell tone={failed ? "error" : "ok"} className="px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-zinc-500 text-xs uppercase tracking-wide font-mono-ui">{label}</span>
        <Icon size={16} className={failed ? "text-verdict-reject" : "text-zinc-600"} />
      </div>
      {loading ? (
        <div className="h-9 w-20 rounded-md bg-zinc-800/80 animate-pulse" aria-hidden="true" />
      ) : failed ? (
        <p className="flex items-center gap-2 text-verdict-reject text-3xl font-black">
          <AlertTriangle size={20} className="opacity-80" />—
        </p>
      ) : (
        <p className="text-white text-3xl font-black tracking-tight">
          {value}
          {suffix || ""}
        </p>
      )}
    </CardShell>
  );
}

function SecondaryStat({ label, icon: Icon, value, suffix, loading, failed }) {
  return (
    <CardShell tone={failed ? "error" : "ok"} className="px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-zinc-500 text-[11px] uppercase tracking-wide">{label}</span>
        <Icon size={13} className={failed ? "text-verdict-reject" : "text-zinc-600"} />
      </div>
      {loading ? (
        <div className="h-6 w-12 rounded bg-zinc-800/80 animate-pulse" aria-hidden="true" />
      ) : failed ? (
        <p className="text-verdict-reject text-lg font-bold">—</p>
      ) : (
        <p className="text-white text-lg font-bold">
          {value}
          {suffix || ""}
        </p>
      )}
    </CardShell>
  );
}

function DashboardMetricsSection() {
  const { metrics, loading, error, retry } = useAdminDashboardMetrics();
  const failed = Boolean(error) && !metrics;

  const approvalChips = APPROVAL_CHIPS.map((chip) => ({
    ...chip,
    value: readValue(metrics, chip.group, chip.key),
  }));
  const hasPending = approvalChips.some((c) => (c.value || 0) > 0);

  return (
    <section className="mb-10">
      {failed && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-verdict-reject/25 bg-verdict-reject/5 px-4 py-3">
          <span className="flex items-center gap-2 text-verdict-reject text-sm">
            <AlertTriangle size={15} />
            Couldn't load platform metrics. Numbers below are unavailable, not zero.
          </span>
          <button
            type="button"
            onClick={retry}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white border border-zinc-700 rounded-full px-3 py-1 transition"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Retry
          </button>
        </div>
      )}

      <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-3">
        Platform at a glance
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {HERO_METRICS.map(({ key, group, label, icon, suffix }) => (
          <HeroStat
            key={key}
            label={label}
            icon={icon}
            suffix={suffix}
            loading={loading && !metrics}
            failed={failed}
            value={readValue(metrics, group, key) ?? 0}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-6">
        {SECONDARY_METRICS.map(({ key, group, label, icon, suffix }) => (
          <SecondaryStat
            key={key}
            label={label}
            icon={icon}
            suffix={suffix}
            loading={loading && !metrics}
            failed={failed}
            value={readValue(metrics, group, key) ?? 0}
          />
        ))}
      </div>

      {!failed && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold mr-1">
            Approvals
          </span>
          {loading && !metrics ? (
            <div className="h-6 w-40 rounded-full bg-zinc-800/80 animate-pulse" aria-hidden="true" />
          ) : hasPending ? (
            approvalChips
              .filter((c) => (c.value || 0) > 0)
              .map((c) => (
                <a
                  key={c.key}
                  href={c.anchor}
                  className="flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 border border-verdict-pending/30 bg-verdict-pending/10 text-verdict-pending hover:brightness-110 transition"
                >
                  <Clock size={12} />
                  {c.value} pending {c.label}
                </a>
              ))
          ) : (
            <span className="text-xs text-zinc-600 border border-zinc-800 rounded-full px-3 py-1.5">
              Nothing pending review.
            </span>
          )}
        </div>
      )}
    </section>
  );
}

export default DashboardMetricsSection;
