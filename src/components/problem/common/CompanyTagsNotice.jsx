import { useState } from "react";
import { Info, X } from "lucide-react";
import { getStorageData, setStorageData } from "../../../services/storageService";

const DISMISS_KEY = "codeclub_company_tags_notice_dismissed_v1";

/**
 * CompanyTagsNotice — small heads-up banner on the Problems page.
 *
 * Company tags on problem cards/filters (ProblemCard.jsx, BrowseToolbar.jsx)
 * aren't real, verified "asked at this company" data yet — every problem
 * currently carries the same placeholder set. This just says so, so it
 * doesn't read as a real signal in the meantime. Remove this banner (and
 * this file) once company tags are actually curated/verified per-problem.
 *
 * Dismissible and remembered via localStorage (same idiom as SectionCard's
 * collapsed state) rather than shown on every single visit — versioned key
 * so bumping DISMISS_KEY brings it back if the message ever needs updating.
 */
function CompanyTagsNotice() {
  const [dismissed, setDismissed] = useState(() => getStorageData(DISMISS_KEY, false));

  if (dismissed) return null;

  function handleDismiss() {
    setStorageData(DISMISS_KEY, true);
    setDismissed(true);
  }

  return (
    <div
      role="status"
      className="w-full bg-amber-500/10 border-b border-amber-500/20 text-amber-200 px-4 py-2 flex items-center justify-center gap-2 text-xs sm:text-sm"
    >
      <Info size={14} strokeWidth={2} className="flex-shrink-0 text-amber-400" aria-hidden="true" />
      <span className="text-center">
        Company tags on problems are placeholder test data for now not yet verified. They'll be
        properly curated per company soon.
      </span>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="flex-shrink-0 p-1 -m-1 rounded hover:bg-amber-500/15 transition"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default CompanyTagsNotice;