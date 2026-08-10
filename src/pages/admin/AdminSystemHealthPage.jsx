import { RefreshCw, Server, Database, Cpu, HardDrive, Clock } from "lucide-react";
import PageMeta from "../../components/seo/PageMeta";
import Button from "../../components/ui/Button";
import { useSystemHealth } from "../../hooks/useSystemHealth";

// Same status vocabulary the backend uses (adminHealthController.js) — up
// is fine, degraded is worth a look, down needs attention, unknown means
// "no evidence yet either way" (e.g. Judge0 with zero traffic so far).
// Command Center design system: same verdict-accept/pending/reject tokens
// used everywhere else in the app (see PatternCard.jsx, SystemStatusPill.jsx)
// instead of one-off green/amber/red utility classes, so this page reads as
// part of the same product rather than a bolted-on admin skin.
const STATUS_STYLES = {
  up: "bg-verdict-accept/10 text-verdict-accept border-verdict-accept/20",
  degraded: "bg-verdict-pending/10 text-verdict-pending border-verdict-pending/20",
  down: "bg-verdict-reject/10 text-verdict-reject border-verdict-reject/20",
  unknown: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  unavailable: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const STATUS_DOT = {
  up: "bg-verdict-accept",
  degraded: "bg-verdict-pending",
  down: "bg-verdict-reject",
  unknown: "bg-zinc-500",
  unavailable: "bg-zinc-500",
};

function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide font-semibold border ${
        STATUS_STYLES[status] || STATUS_STYLES.unknown
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status] || STATUS_DOT.unknown}`} />
      {status}
    </span>
  );
}

function formatBytes(bytes) {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = -1;
  do {
    value /= 1024;
    unitIndex++;
  } while (value >= 1024 && unitIndex < units.length - 1);
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function HealthCard({ icon: Icon, title, status, children }) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3.5 hover:border-zinc-700 transition">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 text-zinc-300 text-sm font-semibold">
          <Icon size={14} className="text-zinc-500" />
          {title}
        </span>
        <StatusPill status={status} />
      </div>
      {children}
    </div>
  );
}

// Plan 008: live snapshot only — no historical uptime charts (that needs a
// metrics-storage pipeline, flagged as a future plan in
// adminHealthController.js) and no alerting/paging integration.
export default function AdminSystemHealthPage() {
  const { health, loading, lastFetchedAt, refresh } = useSystemHealth();

  return (
    <>
      <PageMeta title="System Health — Admin Console — Code Club" description="Live status of the API, database, Judge0, and background jobs." />
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-3 mb-8 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-white">System Health</h1>
            <p className="text-zinc-500 text-sm">
              A live snapshot, not a historical uptime record — hit refresh to re-check.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {lastFetchedAt && (
              <span className="text-zinc-600 text-xs flex items-center gap-1">
                <Clock size={11} />
                Checked {lastFetchedAt.toLocaleTimeString()}
              </span>
            )}
            <Button variant="secondary" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
        </div>

        {loading && !health ? (
          <p className="text-zinc-600 text-sm">Loading…</p>
        ) : !health ? (
          <p className="text-zinc-600 text-sm">Couldn't load system health. Try refreshing.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              <HealthCard icon={Server} title="API" status={health.api.status}>
                <p className="text-zinc-500 text-xs">
                  Self-referential — this page loading at all means the API responded.
                </p>
              </HealthCard>

              <HealthCard icon={Database} title="Database" status={health.db.status}>
                <p className="text-zinc-500 text-xs">Mongo connection state: {health.db.state}</p>
              </HealthCard>

              <HealthCard icon={Cpu} title="Judge0 (code execution)" status={health.judge0.status}>
                <p className="text-zinc-500 text-xs">
                  {health.judge0.requests} requests · {health.judge0.successes} succeeded ·{" "}
                  {health.judge0.failures} failed
                </p>
                {health.judge0.circuitOpen && (
                  <p className="text-red-400 text-xs mt-1">
                    Circuit signal open since{" "}
                    {health.judge0.circuitOpenedAt && new Date(health.judge0.circuitOpenedAt).toLocaleString()}{" "}
                    — 5+ consecutive infra failures.
                  </p>
                )}
              </HealthCard>

              <HealthCard icon={HardDrive} title="Database storage" status={health.storage.status}>
                {health.storage.status === "up" ? (
                  <p className="text-zinc-500 text-xs">
                    {formatBytes(health.storage.dataSizeBytes)} data ·{" "}
                    {formatBytes(health.storage.storageSizeBytes)} on disk ·{" "}
                    {formatBytes(health.storage.indexSizeBytes)} indexes
                  </p>
                ) : (
                  <p className="text-zinc-500 text-xs">{health.storage.reason || "Unavailable."}</p>
                )}
              </HealthCard>
            </div>

            <section>
              <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-3">
                Background jobs
              </h2>
              <p className="text-zinc-600 text-xs mb-3">
                No in-process job scheduler exists in this app today — reported honestly below rather
                than as a fabricated jobs dashboard.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3">
                  <h3 className="text-zinc-400 text-xs uppercase tracking-wide font-semibold mb-2">
                    In this process
                  </h3>
                  {health.backgroundJobs.inProcess.map((job) => (
                    <div key={job.name} className="mb-2 last:mb-0">
                      <p className="text-zinc-200 text-sm">{job.name}</p>
                      <p className="text-zinc-500 text-xs">{job.schedule}</p>
                      <p className="text-zinc-600 text-xs mt-0.5">{job.note}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3">
                  <h3 className="text-zinc-400 text-xs uppercase tracking-wide font-semibold mb-2">
                    External (not tracked by this process)
                  </h3>
                  {health.backgroundJobs.external.map((job) => (
                    <div key={job.name} className="mb-2 last:mb-0">
                      <p className="text-zinc-200 text-sm">{job.name}</p>
                      <p className="text-zinc-500 text-xs">{job.schedule}</p>
                      <p className="text-zinc-600 text-xs mt-0.5">{job.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}