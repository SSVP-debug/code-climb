import React from "react";

function SubmissionDetailsModal({ submission, onClose }) {
  if (!submission) return null;

  const getStatusColor = (status) => {
    if (!status) return "text-zinc-400";
    if (status.includes("Accepted")) return "text-green-400";
    return "text-rose-400";
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Submission Details</h2>
            <p className="text-xs text-zinc-500 font-mono">ID: {submission._id || submission.id}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Status</p>
              <p className={`text-sm font-bold ${getStatusColor(submission.status)}`}>{submission.status}</p>
            </div>
            <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Language</p>
              <p className="text-sm font-bold text-zinc-200 uppercase">{submission.language}</p>
            </div>
            <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Runtime</p>
              <p className="text-sm font-bold text-zinc-200 font-mono">{submission.executionTime || '0'}ms</p>
            </div>
            <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Passed</p>
              <p className="text-sm font-bold text-zinc-200">{submission.passed}/{submission.total}</p>
            </div>
          </div>

          {/* Testcase Breakdown */}
          <div className="space-y-4">
             <div className="flex items-center gap-4 text-xs font-medium">
               <span className="text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20">
                 Visible: {submission.visiblePassed || 0} passed
               </span>
               <span className="text-blue-400 bg-blue-400/10 px-2 py-1 rounded border border-blue-400/20">
                 Hidden: {submission.hiddenPassed || 0} passed
               </span>
             </div>

             {(submission.expectedOutput || submission.actualOutput) && (
               <div className="space-y-4 pt-2">
                 {submission.expectedOutput && (
                   <div className="space-y-2">
                     <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Expected Output</p>
                     <div className="bg-black border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-400 overflow-x-auto">
                       {typeof submission.expectedOutput === 'object' 
                         ? JSON.stringify(submission.expectedOutput, null, 2) 
                         : submission.expectedOutput}
                     </div>
                   </div>
                 )}
                 {submission.actualOutput && (
                   <div className="space-y-2">
                     <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Actual Output</p>
                     <div className="bg-black border border-zinc-800 rounded-xl p-4 font-mono text-xs text-amber-500 overflow-x-auto">
                        {typeof submission.actualOutput === 'object'
                          ? JSON.stringify(submission.actualOutput, null, 2)
                          : submission.actualOutput}
                     </div>
                   </div>
                 )}
               </div>
             )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubmissionDetailsModal;
