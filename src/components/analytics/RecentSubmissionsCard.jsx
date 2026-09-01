import { useState } from "react";
import { FileText, ChevronDown } from "lucide-react";
import SectionCard from "../ui/layout/SectionCard";
import EmptyState from "../ui/feedback/EmptyState";
import { getStatusMeta } from "../../utils/statusMessages";

const PREVIEW_COUNT = 5;
const EXPANDED_COUNT = 15; // capped even when "expanded" — no pagination here

function RecentSubmissionsCard({ submissions }) {
  const [showAll, setShowAll] = useState(false);

  const visible = submissions.slice(0, showAll ? EXPANDED_COUNT : PREVIEW_COUNT);

  return (
    <SectionCard
      title="Recent Submissions"
      icon={<FileText size={18} strokeWidth={2} />}
      accented
      collapsible
      defaultOpen
      storageKey="analytics-collapse-submissions"
    >
      {submissions.length === 0 ? (
        <EmptyState
          icon={<FileText size={28} strokeWidth={1.75} />}
          title="No submissions yet"
          description="Submit your first solution to see your history here."
          actionLabel="Start solving"
          actionHref="/problems"
          compact
        />
      ) : (
        <>
          <div className="space-y-2.5">
            {visible.map((submission) => {
              const meta = getStatusMeta(submission.status);
              return (
                <div
                  key={submission._id || submission.id}
                  className="bg-[var(--surface-elevated)] px-4 py-3 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {submission.problemTitle || submission.problemSlug}
                    </p>
                    <p className="text-[var(--muted-foreground)] text-xs">{submission.language}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-sm font-medium flex-shrink-0 ${meta.color}`}>
                    <meta.icon size={14} strokeWidth={2.25} aria-hidden="true" />
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>

          {submissions.length > PREVIEW_COUNT && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="w-full mt-3 flex items-center justify-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] py-2 rounded-lg hover:bg-[var(--surface-elevated)] transition"
            >
              {showAll
                ? "Show less"
                : `Show ${Math.min(submissions.length, EXPANDED_COUNT) - PREVIEW_COUNT} more`}
              <ChevronDown
                size={15}
                strokeWidth={2}
                className={`transition-transform duration-200 ${showAll ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
          )}
        </>
      )}
    </SectionCard>
  );
}

export default RecentSubmissionsCard;