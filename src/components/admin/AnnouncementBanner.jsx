import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { fetchAnnouncement } from "../../services/api";

// sessionStorage, not localStorage: a dismissed announcement should
// reappear next session (new tab/browser restart), not be permanently
// hidden — this is a temporary "shown once for now" state, not a durable
// user preference (see product-self-knowledge conventions elsewhere in
// this app for the localStorage-vs-session distinction).
const DISMISS_KEY = "codeclub_announcement_dismissed_text";

/**
 * AnnouncementBanner — global banner for the admin-settable announcement
 * (plan 009). Mounted once in App.jsx, above <Routes>, alongside
 * AdminPreviewBanner — checked that spot before building this (per the
 * plan's explicit instruction to look for an existing banner slot first).
 *
 * Deliberately NOT `sticky` (unlike AdminPreviewBanner): stacking two
 * `sticky top-0` siblings without an explicit offset causes them to
 * overlap once both are visible (e.g. an admin viewing an active
 * announcement). A plain top banner that scrolls away with the page is
 * the simpler, correct choice for this kind of infrequent, low-urgency
 * message — it doesn't need to stay pinned the way the admin-identity
 * strip does.
 */
export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState(null);
  const [manuallyDismissed, setManuallyDismissed] = useState(false);

  useEffect(() => {
    fetchAnnouncement().then(setAnnouncement);
  }, []);

  // Derived during render, not a second effect+setState pair — reading
  // sessionStorage here is synchronous and side-effect-free, so there's no
  // need for the react-hooks/set-state-in-effect pattern this codebase's
  // other admin hooks otherwise use for actual async data loads.
  const previouslyDismissed =
    announcement?.text && sessionStorage.getItem(DISMISS_KEY) === announcement.text;
  const dismissed = manuallyDismissed || previouslyDismissed;

  if (!announcement?.active || !announcement.text || dismissed) return null;

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, announcement.text);
    setManuallyDismissed(true);
  }

  return (
    <div className="bg-teal-950 border-b border-teal-800/60 text-teal-200">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <Megaphone size={13} strokeWidth={2} aria-hidden="true" />
          {announcement.text}
        </span>
        <button
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="p-1 rounded-md hover:bg-teal-900 transition flex-shrink-0"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}