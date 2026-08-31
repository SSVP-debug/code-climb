import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toPng } from "html-to-image";
import { ArrowLeft, Download, Lock } from "lucide-react";
import PageMeta from "../../components/seo/PageMeta";
import Button from "../../components/ui/Button";
import ShareCardCanvas from "../../components/opportunities/ShareCardCanvas.jsx";
import { sanitizeFilename } from "../../utils/sanitizeFilename.js";
import { fetchOpportunityAdmin } from "../../services/opportunityApi";

const FORMATS = [
  { value: "mobile", label: "WhatsApp / Discord", hint: "Portrait, optimized for phone screens" },
  { value: "linkedin", label: "LinkedIn", hint: "Portrait with more visual breathing room" },
];

// Only meaningful when format === "mobile" — lets the admin tag which of
// the two channels the mobile-format card is headed to, so referral
// analytics (PART 12/14) can tell WhatsApp traffic from Discord traffic
// even though both share one visual template.
const MOBILE_SOURCE_TAGS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "discord", label: "Discord" },
];

/**
 * AdminGenerateShareCardPage — PART 2-9 of the follow-up spec.
 * Route: /admin/opportunities/:id/share
 *
 * Gated to PUBLISHED opportunities only (PART 9) — an unpublished
 * opportunity has no public page for the QR to point to yet, and
 * generating a public-facing distribution asset for something still in
 * draft/pending/rejected undermines the whole point of the review gate.
 */
export default function AdminGenerateShareCardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cardRef = useRef(null);

  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [format, setFormat] = useState("mobile");
  const [sourceTag, setSourceTag] = useState("whatsapp");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern used throughout this codebase's admin hooks (see src/hooks/useAdminProblems.js's fuller write-up); setLoading(true) here is synchronous by design, all other setState calls happen after the fetch's own await.
    setLoading(true);
    fetchOpportunityAdmin(id)
      .then((data) => setOpportunity(data.opportunity))
      .catch(() => setError("Failed to load opportunity."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDownload() {
    if (!cardRef.current || !opportunity) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      const formatLabel = format === "linkedin" ? "LinkedIn" : "WhatsApp";
      link.download = `${sanitizeFilename(opportunity.ccId)}-${sanitizeFilename(opportunity.title)}-${formatLabel}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setError("Couldn't generate the PNG. Try again.");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-[var(--theme-primary,#2dd4bf)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !opportunity) {
    return <p className="text-red-400 text-sm">{error}</p>;
  }

  const isPublished = opportunity.status === "published";

  return (
    <div className="max-w-4xl">
      <PageMeta title={`Share Card · ${opportunity.ccId} · Admin · Code Club`} path="/admin/opportunities" />

      <button
        onClick={() => navigate("/admin/opportunities")}
        className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition mb-4"
      >
        <ArrowLeft size={12} strokeWidth={2} /> Opportunities
      </button>

      <h1 className="text-xl font-bold text-[var(--foreground)] mb-1">
        Generate Share Card — {opportunity.ccId}
      </h1>
      <p className="text-[var(--muted-foreground)] text-sm mb-6">{opportunity.title}</p>

      {!isPublished ? (
        <div className="flex items-start gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-4 max-w-md">
          <Lock size={18} strokeWidth={2} className="text-[var(--muted-foreground)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[var(--foreground)] font-semibold text-sm">Publish this opportunity first</p>
            <p className="text-[var(--muted-foreground)] text-xs mt-1">
              Share cards can only be generated for published opportunities — this one is currently{" "}
              <span className="text-[var(--foreground)]">{opportunity.status.replace("_", " ")}</span>. Its public page doesn't
              exist yet, so a QR code would have nowhere real to point.
            </p>
            <Link
              to={`/admin/opportunities/${id}/edit`}
              className="inline-block mt-3 text-xs font-semibold text-[var(--theme-primary,#2dd4bf)] hover:underline"
            >
              Open in editor →
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Controls */}
          <div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-2">Choose format</p>
            <div className="space-y-2 mb-5">
              {FORMATS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition ${
                    format === f.value
                      ? "border-[var(--theme-primary,#2dd4bf)]/50 bg-[var(--theme-primary,#2dd4bf)]/10"
                      : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <p className={`text-sm font-semibold ${format === f.value ? "text-[var(--theme-primary,#2dd4bf)]" : "text-[var(--foreground)]"}`}>
                    {f.label}
                  </p>
                  <p className="text-[var(--muted-foreground)] text-[11px] mt-0.5">{f.hint}</p>
                </button>
              ))}
            </div>

            {format === "mobile" && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-2">Tag traffic source</p>
                <div className="flex gap-2">
                  {MOBILE_SOURCE_TAGS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSourceTag(s.value)}
                      className={`flex-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition ${
                        sourceTag === s.value
                          ? "border-[var(--theme-primary,#2dd4bf)]/50 bg-[var(--theme-primary,#2dd4bf)]/10 text-[var(--theme-primary,#2dd4bf)]"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="text-[var(--muted-foreground)] text-[11px] mt-2">
                  Same visual card either way — this only tags the QR/link so admin analytics can tell WhatsApp
                  clicks from Discord clicks.
                </p>
              </div>
            )}

            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

            <Button onClick={handleDownload} loading={exporting} className="w-full justify-center">
              <Download size={14} strokeWidth={2} />
              Download PNG
            </Button>
          </div>

          {/* Preview */}
          <div className="flex justify-center">
            <div>
              <p className="text-xs font-semibold text-[var(--muted-foreground)] mb-2 text-center">Preview</p>
              <ShareCardCanvas
                ref={cardRef}
                opportunity={opportunity}
                format={format}
                sourceTag={format === "mobile" ? sourceTag : "linkedin"}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}