import BrowseToolbar from "./BrowseToolbar";
import ProblemList from "./ProblemList";

function BrowseView({
  loading,
  error,
  filtered,
  topics,
  selectedTopic,
  setSelectedTopic,
  selectedDifficulty,
  setSelectedDifficulty,
  searchTerm,
  setSearchTerm,
  searchSuggestions,
  hideSolved,
  toggleHideSolved,
}) {
  return (
    <>
      <BrowseToolbar
        topics={topics}
        selectedTopic={selectedTopic}
        setSelectedTopic={setSelectedTopic}
        selectedDifficulty={selectedDifficulty}
        setSelectedDifficulty={setSelectedDifficulty}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchSuggestions={searchSuggestions}
        hideSolved={hideSolved}
        toggleHideSolved={toggleHideSolved}
      />

      {/* Error banner */}
      {error && (
        <div className="mb-4 text-sm text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Result count */}
      {!loading && (
        <p className="text-xs text-zinc-500 mb-3">
          {filtered.length} problem{filtered.length !== 1 ? "s" : ""} found
        </p>
      )}

      <ProblemList
        loading={loading}
        filtered={filtered}
        setSelectedDifficulty={setSelectedDifficulty}
        setSelectedTopic={setSelectedTopic}
        setSearchTerm={setSearchTerm}
      />
    </>
  );
}

export default BrowseView;