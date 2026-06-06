// src/components/problem/BottomWorkspaceTabs.jsx

export default function BottomWorkspaceTabs({
  activeTab,
  setActiveTab,
}) {
  return (
    <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
      <button
        onClick={() => setActiveTab("Testcases")}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          activeTab === "Testcases"
            ? "bg-zinc-700 text-white"
            : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
        }`}
      >
        Testcases
      </button>

      <button
        onClick={() => setActiveTab("Debug")}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          activeTab === "Debug"
            ? "bg-zinc-700 text-white"
            : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
        }`}
      >
        Debug
      </button>
    </div>
  );
}