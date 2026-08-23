import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { ExternalLink, MapPin, Clock, Wallet, GraduationCap, Share2 } from "lucide-react";
import PageMeta from "../components/seo/PageMeta";
import VerificationBadge from "../components/opportunities/VerificationBadge";
import ShareCard from "../components/opportunities/ShareCard";
import Button from "../components/ui/Button";
import SectionCard from "../components/ui/layout/SectionCard";
import { formatVerificationDate } from "../utils/formatVerificationDate";
import {
  fetchOpportunity,
  trackOpportunityView,
  trackOpportunityApplyClick,
} from "../services/opportunityApi";

const VALID_SOURCES = ["whatsapp", "discord", "linkedin"];

// Public, canonical Code Club opportunity page (PART 6). No ProtectedRoute:
// this is exactly the page a QR code / shared card sends anyone to,
// logged in or not.
export default function OpportunityDetailPage() {
  const { ccId } = useParams();
  const [searchParams] = useSearchParams();
  const [opportunity, setOpportunity] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showShareCard, setShowShareCard] = useState(false);

  const rawSource = searchParams.get("source");
  const source = VALID_SOURCES.includes(rawSource) ? rawSource : "direct";

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern used throughout this codebase's admin hooks (see src/hooks/useAdminProblems.js's fuller write-up); setLoading(true) here is synchronous by design, all other setState calls happen after the fetch's own await.
    setLoading(true);
    fetchOpportunity(ccId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setNotFound(true);
        } else {
          setOpportunity(data);
          // Once per page load, not once per render — see effect deps.
          trackOpportunityView(data.ccNumber);
        }
      })
      .catch(() => !cancelled && setNotFound(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [ccId]);

  function handleApplyClick() {
    trackOpportunityApplyClick(opportunity.ccNumber, source);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--theme-primary,#2dd4bf)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !opportunity) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <p className="text-white font-bold text-lg mb-2">Opportunity not found</p>
          <p className="text-zinc-500 text-sm mb-6">
            This opportunity may have been removed, or the link is incorrect.
          </p>
          <Button to="/opportunities" variant="secondary" size="sm">
            Browse Opportunity Radar
          </Button>
        </div>
      </div>
    );
  }

  const o = opportunity;
  const isClosed = o.status === "expired";

  return (
    <div className="min-h-screen bg-black text-white">
      <PageMeta
        title={`${o.title} · ${o.organization} — Code Club Opportunity Radar`}
        description={o.shortSummary}
        path={`/opportunities/${o.ccNumber}`}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link to="/opportunities" className="text-xs text-zinc-500 hover:text-zinc-300 transition">
          ← Opportunity Radar
        </Link>

        <div className="flex items-center justify-between mt-4 mb-1">
          <span className="text-[11px] font-mono text-zinc-600 tracking-wide">CODE CLUB OPPORTUNITY RADAR</span>
          <span className="text-[11px] font-mono text-zinc-600">{o.ccId}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">{o.title}</h1>
        <p className="text-zinc-400 font-semibold mt-1">{o.organization}</p>

        {isClosed && (
          <div className="mt-4 text-sm font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 w-fit">
            Applications closed
          </div>
        )}

        {/* Key facts grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
          {o.location && (
            <Fact icon={<MapPin size={14} strokeWidth={2} />} label="Location" value={o.location} />
          )}
          {o.workMode && (
            <Fact icon={<GraduationCap size={14} strokeWidth={2} />} label="Work mode" value={capitalize(o.workMode)} />
          )}
          {o.applicationDeadline && (
            <Fact
              icon={<Clock size={14} strokeWidth={2} />}
              label="Deadline"
              value={formatVerificationDate(o.applicationDeadline)}
            />
          )}
          {o.duration && <Fact icon={<Clock size={14} strokeWidth={2} />} label="Duration" value={o.duration} />}
          {(o.stipend || o.prize) && (
            <Fact icon={<Wallet size={14} strokeWidth={2} />} label={o.stipend ? "Stipend" : "Prize"} value={o.stipend || o.prize} />
          )}
        </div>

        {/* Apply CTA — always the stored officialApplicationUrl, never
            disguised (PART 6/17). */}
        <div className="mt-6">
          {isClosed ? (
            <Button size="lg" disabled>
              Applications closed
            </Button>
          ) : (
            <Button href={o.officialApplicationUrl} target="_blank" rel="noopener noreferrer" onClick={handleApplyClick} size="lg">
              Apply on official website
              <ExternalLink size={16} strokeWidth={2} />
            </Button>
          )}
          <p className="text-[11px] text-zinc-600 mt-2">
            Opens {new URL(o.officialApplicationUrl).hostname} — the organization's own application.
          </p>
        </div>

        <SectionCard title="Why this opportunity matters" className="mt-8">
          <p className="text-zinc-300 text-sm leading-relaxed">{o.shortSummary}</p>
        </SectionCard>

        <SectionCard title="Full description" className="mt-4">
          <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">{o.description}</p>
        </SectionCard>

        {(o.eligibility || o.eligibleDegrees?.length > 0 || o.eligibleBranches?.length > 0) && (
          <SectionCard title="Eligibility" className="mt-4">
            {o.eligibility && <p className="text-zinc-300 text-sm leading-relaxed mb-3">{o.eligibility}</p>}
            <div className="flex flex-wrap gap-2">
              {(o.eligibleDegrees || []).map((d) => (
                <Tag key={d}>{d}</Tag>
              ))}
              {(o.eligibleBranches || []).map((b) => (
                <Tag key={b}>{b}</Tag>
              ))}
              {(o.eligibleGraduationYears || []).map((y) => (
                <Tag key={y}>Class of {y}</Tag>
              ))}
            </div>
          </SectionCard>
        )}

        <SectionCard title="Verification" className="mt-4">
          <VerificationBadge verificationStatus={o.verificationStatus} lastVerifiedAt={o.lastVerifiedAt} />
          <p className="text-xs text-zinc-500 mt-3">
            Official source:{" "}
            <a
              href={o.officialSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white underline"
            >
              {new URL(o.officialSourceUrl).hostname}
            </a>
          </p>
        </SectionCard>

        {/* Share card */}
        <div className="mt-8">
          <button
            onClick={() => setShowShareCard((v) => !v)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition"
          >
            <Share2 size={16} strokeWidth={2} />
            {showShareCard ? "Hide share card" : "Get shareable card"}
          </button>
          {showShareCard && (
            <div className="mt-4 flex flex-wrap gap-6">
              <ShareCard opportunity={o} aspect="portrait" />
              <ShareCard opportunity={o} aspect="square" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Fact({ icon, label, value }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] uppercase tracking-wide mb-1">
        {icon}
        {label}
      </div>
      <p className="text-white text-sm font-semibold truncate">{value}</p>
    </div>
  );
}

function Tag({ children }) {
  return (
    <span className="text-xs font-medium text-zinc-300 bg-zinc-800 px-2.5 py-1 rounded-full">{children}</span>
  );
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
