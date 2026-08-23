import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { ShieldCheck, Download } from "lucide-react";
import { SITE_URL, SITE_DOMAIN } from "../../config/site.js";
import { formatVerificationDate } from "../../utils/formatVerificationDate";
import Button from "../ui/Button";

const TYPE_LABELS = {
  internship: "INTERNSHIP",
  hackathon: "HACKATHON",
  research_internship: "RESEARCH INTERNSHIP",
  open_source_program: "OPEN SOURCE PROGRAM",
  fellowship: "FELLOWSHIP",
  coding_competition: "CODING COMPETITION",
  student_program: "STUDENT PROGRAM",
  scholarship: "SCHOLARSHIP",
  developer_program: "DEVELOPER PROGRAM",
  entry_level_job: "ENTRY-LEVEL JOB",
  other: "OPPORTUNITY",
};

/**
 * ShareCard — PART 10/11/12's shareable visual card.
 *
 * The QR code and visible URL always point to the Code Club opportunity
 * page (`${SITE_URL}/opportunities/:ccNumber`), NEVER the external
 * application URL — that's the whole point of PART 6's canonical-page
 * requirement (research → admin review → Code Club page → external
 * application, never skipping the middle step).
 *
 * `aspect` picks between the two PART 11 minimum formats:
 *   "portrait" (4:5, WhatsApp/Instagram-friendly) or "square" (1:1).
 * Both share the same visual identity/content — only proportions differ.
 */
export default function ShareCard({ opportunity, aspect = "portrait" }) {
  const cardRef = useRef(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [exporting, setExporting] = useState(false);

  const opportunityUrl = `${SITE_URL}/opportunities/${opportunity.ccNumber}`;

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(opportunityUrl, {
      width: 240,
      margin: 1,
      color: { dark: "#09090b", light: "#ffffff" },
    }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [opportunityUrl]);

  async function handleDownload() {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `code-club-${opportunity.ccId.replace("/", "-")}.png`;
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

  const dims = aspect === "square" ? "aspect-square w-full max-w-sm" : "aspect-[4/5] w-full max-w-sm";
  const verified = opportunity.verificationStatus === "verified";

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={cardRef}
        className={`${dims} bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden`}
      >
        {/* Accent glow */}
        <div
          aria-hidden="true"
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[var(--theme-primary,#2dd4bf)]/10 blur-3xl"
        />

        {/* Header */}
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <p className="text-white font-black text-sm tracking-widest">CODE CLUB</p>
            <span className="text-[10px] font-mono text-zinc-500">{opportunity.ccId}</span>
          </div>
          <p className="text-[var(--theme-primary,#2dd4bf)] text-[10px] font-bold tracking-[0.2em] mt-0.5">
            OPPORTUNITY RADAR
          </p>
        </div>

        {/* Body */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-4">
          <span className="inline-block w-fit text-[10px] font-bold tracking-wider text-zinc-400 bg-zinc-800/80 px-2 py-1 rounded-full mb-3">
            {TYPE_LABELS[opportunity.type] || "OPPORTUNITY"}
          </span>
          <h3 className="text-white font-black text-xl leading-tight">{opportunity.title}</h3>
          <p className="text-zinc-400 text-sm font-semibold mt-1">{opportunity.organization}</p>

          <div className="flex items-center gap-3 mt-4 text-xs text-zinc-500">
            {opportunity.workMode && <span className="uppercase">{opportunity.workMode}</span>}
            {opportunity.applicationDeadline && (
              <>
                <span aria-hidden="true">·</span>
                <span>Deadline {formatVerificationDate(opportunity.applicationDeadline)}</span>
              </>
            )}
          </div>

          {verified && (
            <div className="flex items-center gap-1.5 mt-3 text-[var(--theme-primary,#2dd4bf)] text-xs font-bold">
              <ShieldCheck size={14} strokeWidth={2.5} />
              VERIFIED BY CODE CLUB
            </div>
          )}
        </div>

        {/* Footer — QR + URL */}
        <div className="relative z-10 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-zinc-600 text-[9px] uppercase tracking-wider">Scan or visit</p>
            <p className="text-zinc-300 text-[11px] font-mono truncate">
              {SITE_DOMAIN}/opportunities/{opportunity.ccNumber}
            </p>
          </div>
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt="QR code linking to this opportunity on Code Club"
              className="w-16 h-16 rounded-md flex-shrink-0 bg-white p-1"
            />
          )}
        </div>
      </div>

      <Button variant="secondary" size="sm" onClick={handleDownload} loading={exporting}>
        <Download size={14} strokeWidth={2} />
        Download {aspect === "square" ? "square" : "portrait"} card
      </Button>
    </div>
  );
}
