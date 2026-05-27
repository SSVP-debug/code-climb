import React from "react";
import Editor from "@monaco-editor/react";

function ProblemEditor({
  language,
  setLanguage,
  code,
  setCode,
  customInput,
  setCustomInput,
  onRun,
  onSubmit,
  running,
  submitting,
}) {
  return (
    <div className="flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Language</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-zinc-800 text-zinc-200 text-sm border-none rounded-md px-2 py-1 outline-none hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-grow min-h-[400px]">
        <Editor
          height="100%"
          language={language === "cpp" ? "cpp" : language === "python" ? "python" : language}
          value={code}
          onChange={(value) => setCode(value || "")}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: language === "javascript" ? 2 : 4,
          }}
        />
      </div>

      {/* Editor Footer / Controls */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
        <div className="mb-4">
          <label
            htmlFor="custom-input"
            className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2"
          >
            Custom Input (Run Code only)
          </label>
          <textarea
            id="custom-input"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 font-mono text-sm text-zinc-200 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600"
            placeholder="Enter standard input..."
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onRun}
            disabled={running || submitting}
            className="px-5 py-2 rounded-xl text-sm font-semibold border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? "Running..." : "Run Code"}
          </button>
          <button
            onClick={onSubmit}
            disabled={running || submitting}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              submitting
                ? "bg-green-500/20 text-green-500 border border-green-500/30"
                : "bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-900/20"
            }`}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProblemEditor;
