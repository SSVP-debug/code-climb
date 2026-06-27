const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];

const DIFF_STYLES = {
  All:    "bg-green-500 text-black",
  Easy:   "bg-green-500 text-black",
  Medium: "bg-yellow-500 text-black",
  Hard:   "bg-red-500 text-white",
};

const DIFF_INACTIVE = {
  All:    "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200",
  Easy:   "border-zinc-700 text-green-600 hover:border-green-600/50 hover:text-green-400",
  Medium: "border-zinc-700 text-yellow-600 hover:border-yellow-600/50 hover:text-yellow-400",
  Hard:   "border-zinc-700 text-red-600 hover:border-red-600/50 hover:text-red-400",
};

function BrowseToolbar({
  topics,
  selectedTopic,
  setSelectedTopic,
  selectedDifficulty,
  setSelectedDifficulty,
  searchTerm,
  setSearchTerm,
  hideSolved,
  toggleHideSolved,
}) {
  return (
    <div className="flex flex-col gap-3 mb-5">

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
          width="15" height="15" viewBox="0 0 15 15" fill="none"
        >
          <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10 10L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Search problems…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-green-500/50 focus:bg-zinc-800/50 transition"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
            aria-label="Clear search"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Hide Solved toggle ──────────────────────────────────────────── */}
      {/* The #1 filter returning users need — placed prominently above topic/diff */}
      <button
        onClick={toggleHideSolved}
        className={`flex items-center gap-2 w-fit px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
          hideSolved
            ? "bg-green-500/10 border-green-500/40 text-green-400"
            : "bg-transparent border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
        }`}
        aria-pressed={hideSolved}
      >
        {/* Checkbox-style icon */}
        <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all ${
          hideSolved ? "bg-green-500 border-green-500" : "border-zinc-600"
        }`}>
          {hideSolved && (
            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
              <path d="M1 3.5L3.5 6L8 1" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
        Hide solved
      </button>

      {/* ── Topics ─────────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Topics</p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {topics.map((topic) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedTopic === topic
                  ? "bg-green-500 text-black"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* ── Difficulty ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Difficulty</p>
        <div className="flex gap-1.5">
          {DIFFICULTIES.map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                selectedDifficulty === diff
                  ? DIFF_STYLES[diff]
                  : `bg-transparent ${DIFF_INACTIVE[diff]}`
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}

export default BrowseToolbar;
