/**
 * LinkedInShareButton
 *
 * Opens LinkedIn's share intent for a given URL in a popup window.
 *
 * LinkedIn's share endpoint only accepts a `url` param — the old
 * `title`/`summary`/`source` params were deprecated years ago and are
 * silently ignored now. LinkedIn scrapes the target URL's Open Graph tags
 * (og:title/og:description/og:image) for the actual preview card. That
 * means this button is only as good as the target page's <PageMeta />
 * — pointing it at a page with no OG tags produces a blank/generic card.
 */
function LinkedInShareButton({ url, label = "Share on LinkedIn", className = "" }) {
  function handleShare() {
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=600");
  }

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-2 rounded-xl border border-blue-600/30 bg-blue-600/10 text-blue-300 px-3.5 py-2 text-sm font-medium hover:bg-blue-600/20 transition ${className}`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
      </svg>
      {label}
    </button>
  );
}

export default LinkedInShareButton;