import { formatRuntime, formatDate } from "../../utils/formatters";
import { getStatusMeta } from "../../utils/statusMessages";

function SubmissionHistory({ submissions, onSelectSubmission }) {

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 h-full overflow-hidden flex flex-col">
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center justify-between">
        Submissions
        <span className="text-xs bg-[var(--surface-elevated)] text-[var(--muted-foreground)] px-2 py-1 rounded-md font-mono">
          {submissions.length} total
        </span>
      </h3>

      <div className="flex-grow overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--muted-foreground)]">
            <svg className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="text-[var(--muted-foreground)] text-sm space-y-2">
              <p>No submissions yet.</p>
              <p>Run or submit code to see history.</p>
            </div>
          </div>
        ) : (
          [...submissions].reverse().map((submission) => (
            <div
              key={submission._id || submission.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectSubmission(submission)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectSubmission(submission);
                }
              }}
              className="group bg-[var(--surface-elevated)]/30 border border-[var(--border-strong)]/30 rounded-xl p-4 cursor-pointer hover:bg-[var(--surface-elevated)]/60 hover:border-[var(--border-strong)] transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary,#2dd4bf)]"
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[15px] font-bold ${getStatusMeta(submission.status).color}`}>
                  {submission.status.split(' ')[0]}
                </span>
                <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase bg-[var(--surface)]/50 px-2 py-0.5 rounded border border-[var(--border)]">
                  {submission.language}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--muted-foreground)]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--muted-foreground)]">Passed:</span>
                  <span className="text-[var(--foreground)]">{submission.passed}/{submission.total}</span>
                </div>
                {submission.executionTime != null && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[var(--muted-foreground)]">Time:</span>
                    {/* formatRuntime already appends its own unit (ms/s) — call once, no trailing suffix */}
                    <span className="text-[var(--foreground)]">{formatRuntime(submission.executionTime)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
                  <span className="text-[var(--muted-foreground)]">Date:</span>
                  <span className="text-[var(--muted-foreground)]">{submission.date || (submission.createdAt ? formatDate(submission.createdAt) : 'N/A')}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SubmissionHistory;