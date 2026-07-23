/**
 * MobileTabBar — the problem/code/results tab switcher shown below the `lg`
 * breakpoint on a problem's detail page.
 *
 * Extracted from src/pages/ProblemDetailsPage.jsx (Staff review §4/§9/#12).
 */
const MOBILE_TABS = [
  { id: "problem", label: "Problem" },
  { id: "code", label: "Code" },
  { id: "results", label: "Results" },
];

function MobileTabBar({ active, onChange, hasResults, resultsEnabled = hasResults }) {
  return (
    <div className="flex border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
      {MOBILE_TABS.map((tab) => {
        const isDisabled = tab.id === "results" && !resultsEnabled;
        return (
          <button
            key={tab.id}
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange(tab.id)}
            className={`
              flex-1 py-3 text-xs font-semibold uppercase tracking-widest
              transition-colors relative
              ${isDisabled
                ? "text-zinc-700 cursor-not-allowed"
                : active === tab.id ? "text-white" : "text-zinc-500 hover:text-zinc-300"}
            `}
          >
            {tab.label}
            {tab.id === "results" && hasResults && (
              <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-green-400 align-middle" />
            )}
            {active === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default MobileTabBar;