import React from "react";

function SubmissionHistory({ submissions, onSelectSubmission }) {
  const getStatusColor = (status) => {
    if (!status) return "text-zinc-400";
    if (status.includes("Accepted")) return "text-green-400";
    return "text-rose-400";
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 h-full overflow-hidden flex flex-col">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
        Submissions
        <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-1 rounded-md font-mono">
          {submissions.length} total
        </span>
      </h3>

      <div className="flex-grow overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-600">
            <svg className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No submissions recorded for this problem yet.</p>
          </div>
        ) : (
          [...submissions].reverse().map((submission) => (
            <div
              key={submission._id || submission.id}
              onClick={() => onSelectSubmission(submission)}
              className="group bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-4 cursor-pointer hover:bg-zinc-800/60 hover:border-zinc-600 transition-all active:scale-[0.98]"
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[15px] font-bold ${getStatusColor(submission.status)}`}>
                  {submission.status.split(' ')[0]}
                </span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase bg-zinc-900/50 px-2 py-0.5 rounded border border-zinc-800">
                  {submission.language}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-600">Passed:</span>
                  <span className="text-zinc-200">{submission.passed}/{submission.total}</span>
                </div>
                {submission.executionTime && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-600">Time:</span>
                    <span className="text-zinc-200">{submission.executionTime}ms</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
                  <span className="text-zinc-600">Date:</span>
                  <span className="text-zinc-500">{submission.date || (submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : 'N/A')}</span>
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
