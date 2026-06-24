import React from "react";

function ProblemHeader({ problem, isSolved }) {
  if (!problem) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-2xl xl:text-3xl font-bold text-white leading-tight">
          {problem.title}
        </h1>
        {isSolved && (
          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-md border border-green-500/30 uppercase tracking-wider">
            Solved
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${ 
            problem.difficulty === "Easy"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : problem.difficulty === "Medium"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
          }`}
        >
          {problem.difficulty}
        </span>
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
    </div>
  );
}

export default ProblemHeader;
