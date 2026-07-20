import Button from "../ui/Button";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function QueueRow({ title, subtitle, meta, onApprove, onReject, busy }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3">
      <div className="min-w-0">
        <p className="text-white font-semibold text-sm truncate">{title}</p>
        <p className="text-zinc-500 text-xs truncate">{subtitle}</p>
        {meta && <p className="text-zinc-600 text-[11px] mt-0.5">{meta}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" variant="secondary" disabled={busy} loading={busy === "reject"} onClick={onReject}>
          Reject
        </Button>
        <Button size="sm" variant="primary" disabled={busy} loading={busy === "approve"} onClick={onApprove}>
          Approve
        </Button>
      </div>
    </div>
  );
}

/**
 * VerificationQueueSection — the recruiter-requests and TPO/college-requests
 * sections are identical in structure (a heading with a count, a loading/
 * empty state, and a list of QueueRows), differing only in what data and
 * row-shaping function they use. One component, parameterized, instead of
 * two near-duplicate blocks (which is what src/pages/AdminConsolePage.jsx
 * had before this extraction — Staff review §4/§9/#12).
 */
function VerificationQueueSection({ heading, loading, emptyLabel, items, busyIds, getRow, onApprove, onReject }) {
  return (
    <section className="mb-10">
      <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-3">
        {heading} {items.length > 0 && `(${items.length})`}
      </h2>
      {loading ? (
        <p className="text-zinc-600 text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-zinc-600 text-sm">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const row = getRow(item);
            return (
              <QueueRow
                key={row.id}
                title={row.title}
                subtitle={row.subtitle}
                meta={row.meta}
                busy={busyIds[row.id]}
                onApprove={() => onApprove(row.id)}
                onReject={() => onReject(row.id)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

export { formatDate };
export default VerificationQueueSection;
