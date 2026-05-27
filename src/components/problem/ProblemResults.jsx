import React from "react";

function ProblemResults({
  status,
  output,
  executionMeta,
  judgeState,
  testcaseProgress,
  submitting,
}) {
  if (!status && !output && !judgeState && !testcaseProgress) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-zinc-500 text-sm italic">
        Run your code to see the output here...
      </div>
    );
  }

  const getStatusColor = (status) => {
    if (!status) return "text-zinc-400";
    if (status.includes("Accepted")) return "text-green-400";
    if (status.includes("Pending") || status.includes("Running")) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <div className="flex flex-col gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Status</p>
          <p className={`text-lg font-bold ${getStatusColor(status)}`}>
            {status || (submitting ? "Judging..." : "Ready")}
          </p>
        </div>

        {executionMeta && (
          <div className="flex gap-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest text-right">Runtime</p>
              <p className="text-zinc-200 font-mono text-sm text-right">
                {executionMeta.time ? `${executionMeta.time}s` : "0.0s"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest text-right">Memory</p>
              <p className="text-zinc-200 font-mono text-sm text-right">
                {executionMeta.memory ? `${executionMeta.memory} KB` : "0 KB"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Progress */}
      {(judgeState || testcaseProgress) && (
        <div className="bg-zinc-800/20 border border-zinc-700/30 rounded-xl p-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-zinc-400 font-medium">{judgeState || "Judging"}</span>
            {testcaseProgress && (
              <span className="text-blue-400 font-bold">
                {testcaseProgress.current} / {testcaseProgress.total} Testcases
              </span>
            )}
          </div>
          {testcaseProgress && (
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full transition-all duration-300 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                style={{ width: `${(testcaseProgress.current / testcaseProgress.total) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Output Console */}
      <div className="flex-grow">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Console Output</p>
        <div className="bg-black border border-zinc-800 rounded-xl p-4 min-h-[150px] font-mono text-sm overflow-auto max-h-[300px]">
          {output ? (
            <pre className="text-zinc-300 whitespace-pre-wrap leading-relaxed">{output}</pre>
          ) : (
            <span className="text-zinc-700 italic">Console is empty</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProblemResults;
