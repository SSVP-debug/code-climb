import React from "react";
import { Check } from "lucide-react";

const COMPANY_COLORS = {
  Amazon:    "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Google:    "bg-blue-500/10   text-blue-400   border-blue-500/20",
  Microsoft: "bg-sky-500/10    text-sky-400    border-sky-500/20",
  Facebook:  "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  Apple:     "bg-zinc-500/10   text-zinc-300   border-zinc-500/20",
  Bloomberg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  LinkedIn:  "bg-blue-600/10   text-blue-300   border-blue-600/20",
  Flipkart:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  default:   "bg-zinc-800/50   text-zinc-400   border-zinc-700/50",
};

function CompanyChip({ name }) {
  const cls = COMPANY_COLORS[name] ?? COMPANY_COLORS.default;
  return (
    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${cls}`}>
      {name}
    </span>
  );
}

function ProblemHeader({ problem, isSolved, hideDifficulty = false }) {
  if (!problem) return null;

  const companies = problem.companies ?? [];

  return (
    <div className="mb-5">
      {/* Title row */}
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-2xl xl:text-3xl font-bold text-white leading-tight">
          {problem.title}
        </h1>
        {isSolved && (
          <span className="px-2 py-1 bg-verdict-accept/20 text-verdict-accept text-xs font-bold rounded-md border border-verdict-accept/30 uppercase tracking-wider inline-flex items-center gap-1">
            <Check size={12} strokeWidth={3} aria-hidden="true" /> Solved
          </span>
        )}
      </div>

      {/* Meta row: difficulty + topic + time */}
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        {!hideDifficulty && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
            problem.difficulty === "Easy"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : problem.difficulty === "Medium"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
          }`}>
            {problem.difficulty}
          </span>
        )}

        <span className="px-3 py-1 bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 rounded-full text-xs font-medium">
          {problem.topic}
        </span>

        {problem.estimatedTime && (
          <span className="flex items-center gap-1.5 text-zinc-500 text-xs font-mono">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M6 3.5V6L7.5 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {problem.estimatedTime}
          </span>
        )}
      </div>

      {/* Company tags row — shown only when companies are present */}
      {companies.length > 0 && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">
            Asked at
          </span>
          {companies.slice(0, 6).map(co => (
            <CompanyChip key={co} name={co} />
          ))}
          {companies.length > 6 && (
            <span className="text-[10px] text-zinc-600">
              +{companies.length - 6} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default ProblemHeader;