// src/components/problem/BottomWorkspaceTabs.jsx

export default function BottomWorkspaceTabs({
  activeTab,
  setActiveTab,
}) {
  return (
    <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
      <button
        onClick={() => setActiveTab("testcases")}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          activeTab === "testcases"
            ? "bg-zinc-700 text-white"
            : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
        }`}
      >
        testcases
      </button>

      <button
        onClick={() => setActiveTab("debug")}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          activeTab === "debug"
            ? "bg-zinc-700 text-white"
            : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
        }`}
      >
        debug
      </button>
    </div>
  );
}