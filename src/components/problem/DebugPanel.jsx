export default function DebugPanel({ debugInfo }) {

  if (debugInfo) {
    return (
      <div className="p-5 space-y-3">
        <ErrorHeader kind={debugInfo.type} />

        <ErrorBlock
          text={debugInfo.message}
          color="red"
        />

        {debugInfo.testcase && (
          <p className="text-xs text-zinc-500 font-mono">
            Example {debugInfo.testcase}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="text-zinc-500 text-sm">
        No issues detected.
      </div>
    </div>
  );
}