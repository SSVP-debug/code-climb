import { useTheme } from "../../../hooks/useTheme";

const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];

// "All" isn't a difficulty — it's a UI selection state, so it's handled
// separately below with the theme color instead of living in this semantic
// green/yellow/red map. Easy/Medium/Hard stay fixed regardless of universe
// (Phase 11D decision — difficulty must read the same in every theme).
const DIFF_STYLES = {
  Easy:   "bg-green-500 text-black",
  Medium: "bg-yellow-500 text-black",
  Hard:   "bg-red-500 text-white",
};

const DIFF_INACTIVE = {
  Easy:   "border-[var(--border-strong)] text-green-600 hover:border-green-600/50 hover:text-green-400",
  Medium: "border-[var(--border-strong)] text-yellow-600 hover:border-yellow-600/50 hover:text-yellow-400",
  Hard:   "border-[var(--border-strong)] text-red-600 hover:border-red-600/50 hover:text-red-400",
};

function BrowseToolbar({
  topics,
  selectedTopic,
  setSelectedTopic,
  selectedDifficulty,
  setSelectedDifficulty,
  searchTerm,
  setSearchTerm,
  searchSuggestions = [],
  hideSolved,
  toggleHideSolved,
}) {
  const { theme } = useTheme();
  return (
    <div className="flex flex-col gap-3 mb-5">

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] pointer-events-none"
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
          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--theme-primary,#2dd4bf)] focus:bg-[var(--surface-elevated)]/50 transition"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary,#2dd4bf)]"
            aria-label="Clear search"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Search suggestions ─────────────────────────────────────────── */}
      {/* Only companies/patterns — topics already have their own always-
          visible chip row below, so surfacing them here too would be
          redundant. */}
      {searchSuggestions.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap -mt-1">
          <span className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] mr-0.5">
            Matches
          </span>
          {searchSuggestions.map((s) => (
            <button
              key={`${s.type}:${s.value}`}
              onClick={() => setSearchTerm(s.value)}
              className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--theme-primary,#2dd4bf)] hover:text-[var(--foreground)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary,#2dd4bf)]"
            >
              {s.value}
              <span className="text-[var(--muted-foreground)] ml-1">{s.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Hide Solved toggle ──────────────────────────────────────────── */}
      {/* The #1 filter returning users need — placed prominently above topic/diff */}
      <button
        onClick={toggleHideSolved}
        className={`flex items-center gap-2 w-fit px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary,#2dd4bf)] ${
          hideSolved
            ? "bg-transparent"
            : "bg-transparent border-[var(--border-strong)] text-[var(--muted-foreground)] hover:border-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        }`}
        style={
          hideSolved
            ? {
                backgroundColor: `${theme.colors.primary}1a`,
                borderColor: `${theme.colors.primary}66`,
                color: theme.colors.primary,
              }
            : undefined
        }
        aria-pressed={hideSolved}
      >
        {/* Checkbox-style icon */}
        <span
          className="w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all"
          style={
            hideSolved
              ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
              : { borderColor: "var(--border-strong)" }
          }
        >
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
        <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] mb-2">Topics</p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {topics.map((topic) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`flex-shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary,#2dd4bf)] ${
                selectedTopic === topic
                  ? ""
                  : "bg-[var(--surface)] border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
              }`}
              style={
                selectedTopic === topic
                  ? { backgroundColor: theme.colors.primary, color: "#09090b" }
                  : undefined
              }
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {/* ── Difficulty ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)] mb-2">Difficulty</p>
        <div className="flex gap-1.5">
          {DIFFICULTIES.map((diff) => {
            if (diff === "All") {
              const active = selectedDifficulty === "All";
              return (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty("All")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary,#2dd4bf)] ${
                    active
                      ? ""
                      : "bg-transparent border-[var(--border-strong)] text-[var(--muted-foreground)] hover:border-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                  style={
                    active
                      ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, color: "#09090b" }
                      : undefined
                  }
                >
                  All
                </button>
              );
            }

            return (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary,#2dd4bf)] ${
                  selectedDifficulty === diff
                    ? DIFF_STYLES[diff]
                    : `bg-transparent ${DIFF_INACTIVE[diff]}`
                }`}
              >
                {diff}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}

export default BrowseToolbar;