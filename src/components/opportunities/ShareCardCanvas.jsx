import { forwardRef, useEffect, useState } from "react";
import QRCode from "qrcode";
import { ShieldCheck } from "lucide-react";
import { SITE_URL, SITE_DOMAIN } from "../../config/site.js";
import { formatVerificationDate } from "../../utils/formatVerificationDate";

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
 * ShareCardCanvas — the single reusable, data-driven template behind
 * every generated share card. One opportunity's data in, a fully branded
 * card out — CC/028 automatically looks right the moment it's published,
 * with zero manual design work, by construction (PART 6/11 of the spec:
 * no per-opportunity Canva/Figma step, ever).
 *
 * `format`:
 *   "mobile"   — portrait 4:5, optimized for WhatsApp/Discord: bigger
 *                type, shorter line lengths, built to be legible at
 *                phone-screen thumbnail size.
 *   "linkedin" — 4:5 portrait with more breathing room/visual hierarchy,
 *                per PART 5's "can have slightly more visual hierarchy/
 *                space than the WhatsApp/Discord version."
 *
 * The QR code and the printed URL ALWAYS point to the Code Club
 * opportunity page — `${SITE_URL}/opportunities/:ccNumber`, optionally
 * with `?source=<sourceTag>` for referral attribution (PART 12/14) —
 * never the external application URL. That distinction is enforced here,
 * not left to each caller to get right.
 *
 * The "✓ VERIFIED BY CODE CLUB" badge only ever renders when
 * `opportunity.verificationStatus === "verified"` — an AI-imported or
 * not-yet-verified opportunity never shows it, regardless of format.
 */
const ShareCardCanvas = forwardRef(function ShareCardCanvas(
  { opportunity: o, format = "mobile", sourceTag = null },
  ref
) {
  const [qrDataUrl, setQrDataUrl] = useState(null);

  const opportunityUrl = sourceTag
    ? `${SITE_URL}/opportunities/${o.ccNumber}?source=${sourceTag}`
    : `${SITE_URL}/opportunities/${o.ccNumber}`;
  const displayUrl = `${SITE_DOMAIN}/opportunities/${o.ccNumber}`;

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(opportunityUrl, {
      width: 300,
      margin: 1,
      color: { dark: "#09090b", light: "#ffffff" },
    }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [opportunityUrl]);

  const verified = o.verificationStatus === "verified";
  const isLinkedIn = format === "linkedin";

  return (
    <div
      ref={ref}
      className={`w-full max-w-sm bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-zinc-800 rounded-3xl relative overflow-hidden flex flex-col justify-between ${
        isLinkedIn ? "aspect-[4/5] p-8" : "aspect-[4/5] p-6"
      }`}
    >
      <div
        aria-hidden="true"
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[var(--theme-primary,#2dd4bf)]/10 blur-3xl"
      />

      {/* Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <p className={`text-white font-black tracking-widest ${isLinkedIn ? "text-base" : "text-sm"}`}>
            CODE CLUB
          </p>
          <span className="text-[10px] font-mono text-zinc-500">{o.ccId}</span>
        </div>
        <p
          className={`text-[var(--theme-primary,#2dd4bf)] font-bold tracking-[0.2em] mt-1 ${
            isLinkedIn ? "text-xs" : "text-[10px]"
          }`}
        >
          OPPORTUNITY RADAR
        </p>
      </div>

      {/* Body */}
      <div className={`relative z-10 flex-1 flex flex-col justify-center ${isLinkedIn ? "py-6" : "py-4"}`}>
        <span
          className={`inline-block w-fit font-bold tracking-wider text-zinc-400 bg-zinc-800/80 rounded-full mb-3 ${
            isLinkedIn ? "text-[11px] px-2.5 py-1" : "text-[10px] px-2 py-1"
          }`}
        >
          {TYPE_LABELS[o.type] || "OPPORTUNITY"}
        </span>
        <h3 className={`text-white font-black leading-tight ${isLinkedIn ? "text-2xl" : "text-xl"}`}>{o.title}</h3>
        <p className={`text-zinc-400 font-semibold mt-1.5 ${isLinkedIn ? "text-base" : "text-sm"}`}>
          {o.organization}
        </p>

        <div className={`flex items-center gap-3 mt-4 text-zinc-500 uppercase ${isLinkedIn ? "text-xs" : "text-[11px]"}`}>
          {o.workMode && <span>{o.workMode}</span>}
          {o.category && (
            <>
              <span aria-hidden="true">·</span>
              <span className="normal-case">{o.category}</span>
            </>
          )}
        </div>

        {o.applicationDeadline && (
          <div className="mt-4">
            <p className="text-zinc-600 text-[10px] uppercase tracking-wider">Deadline</p>
            <p className={`text-white font-bold ${isLinkedIn ? "text-base" : "text-sm"}`}>
              {formatVerificationDate(o.applicationDeadline).toUpperCase()}
            </p>
          </div>
        )}

        {verified && (
          <div
            className={`flex items-center gap-1.5 mt-4 text-[var(--theme-primary,#2dd4bf)] font-bold ${
              isLinkedIn ? "text-sm" : "text-xs"
            }`}
          >
            <ShieldCheck size={isLinkedIn ? 16 : 14} strokeWidth={2.5} />
            VERIFIED BY CODE CLUB
          </div>
        )}
      </div>

      {/* Footer — QR + URL, always Code Club's own canonical page */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        {qrDataUrl && (
          <img
            src={qrDataUrl}
            alt="QR code linking to this opportunity on Code Club"
            className={`rounded-lg bg-white p-1.5 ${isLinkedIn ? "w-28 h-28" : "w-24 h-24"}`}
          />
        )}
        <div className="text-center">
          <p className="text-zinc-500 text-[10px]">Scan for details &amp; official application</p>
          <p className="text-zinc-300 text-[11px] font-mono mt-0.5">{displayUrl}</p>
        </div>
      </div>
    </div>
  );
});

export default ShareCardCanvas;
