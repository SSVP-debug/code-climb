import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download } from "lucide-react";
import ShareCardCanvas from "./ShareCardCanvas.jsx";
import { sanitizeFilename } from "../../utils/sanitizeFilename.js";
import Button from "../ui/Button";

/**
 * ShareCard — student-facing "get a shareable card" button on the public
 * opportunity page (OpportunityDetailPage.jsx). Thin wrapper around the
 * shared ShareCardCanvas template + a download-to-PNG button.
 *
 * For the admin's dedicated share-card generation workflow (format
 * picker, source-tag selection, live preview) see
 * pages/admin/AdminGenerateShareCardPage.jsx, which uses ShareCardCanvas
 * directly rather than this wrapper.
 */
export default function ShareCard({ opportunity, format = "mobile" }) {
  const cardRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  async function handleDownload() {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      const formatLabel = format === "linkedin" ? "LinkedIn" : "WhatsApp";
      link.download = `${sanitizeFilename(opportunity.ccId)}-${sanitizeFilename(opportunity.title)}-${formatLabel}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // Export failing shouldn't break the page — the card is still
      // visible on-screen even if the download itself didn't work
      // (e.g. an ad-blocker interfering with canvas export).
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <ShareCardCanvas ref={cardRef} opportunity={opportunity} format={format} />
      <Button variant="secondary" size="sm" onClick={handleDownload} loading={exporting}>
        <Download size={14} strokeWidth={2} />
        Download {format === "linkedin" ? "LinkedIn" : "WhatsApp/Discord"} card
      </Button>
    </div>
  );
}
