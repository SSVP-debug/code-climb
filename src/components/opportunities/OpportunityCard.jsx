import { Link } from "react-router-dom";
import { MapPin, Clock } from "lucide-react";
import VerificationBadge from "./VerificationBadge";
import { formatVerificationDate } from "../../utils/formatVerificationDate";

const TYPE_LABELS = {
  internship: "Internship",
  hackathon: "Hackathon",
  research_internship: "Research Internship",
  open_source_program: "Open Source Program",
  fellowship: "Fellowship",
  coding_competition: "Coding Competition",
  student_program: "Student Program",
  scholarship: "Scholarship",
  developer_program: "Developer Program",
  entry_level_job: "Entry-Level Job",
  other: "Opportunity",
};

export default function OpportunityCard({ opportunity }) {
  const o = opportunity;

  return (
    <Link
      to={`/opportunities/${o.ccNumber}`}
      className="group block bg-zinc-900 border border-zinc-800 hover:border-[var(--theme-primary,#2dd4bf)]/40 rounded-2xl p-5 transition"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-[11px] font-mono text-zinc-600 tracking-wide">{o.ccId}</span>
        <VerificationBadge verificationStatus={o.verificationStatus} compact />
      </div>

      <h3 className="text-white font-bold text-base leading-snug group-hover:text-[var(--theme-primary,#2dd4bf)] transition">
        {o.title}
      </h3>
      <p className="text-zinc-500 text-sm mt-0.5">{o.organization}</p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 text-xs text-zinc-500">
        <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium">
          {TYPE_LABELS[o.type] || o.type}
        </span>
        {o.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={12} strokeWidth={2} /> {o.location}
          </span>
        )}
        {o.applicationDeadline && (
          <span className="inline-flex items-center gap-1">
            <Clock size={12} strokeWidth={2} /> Closes {formatVerificationDate(o.applicationDeadline)}
          </span>
        )}
      </div>
    </Link>
  );
}
