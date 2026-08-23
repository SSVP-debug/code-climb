import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, AlertTriangle, CheckCircle2, ArrowLeft } from "lucide-react";
import PageMeta from "../../components/seo/PageMeta";
import Button from "../../components/ui/Button";
import { formatVerificationDate } from "../../utils/formatVerificationDate";
import {
  extractOpportunitiesAdmin,
  importSelectedOpportunitiesAdmin,
} from "../../services/opportunityApi";

const TYPE_LABELS = {
  internship: "Internship",
  hackathon: "Hackathon",
  research_internship: "Research Internship",
  open_source_program: "Open Source Program",
  fellowship: "Fellowship",
  coding_competition: "Coding Competition",
  student_program: "Student Program",
  scholarship: "Scholarship",
  developer_program: "Developer Program",
  entry_level_job: "Entry-Level Job",
  other: "Other",
};

/**
 * AdminOpportunityImportPage — the "paste research → extract → review →
 * import as drafts" workflow. This is intentionally a two-screen wizard
 * (paste, then review) rather than a single page — the review step needs
 * its own room to show flags per-candidate without the input textarea
 * crowding it out.
 *
 * What happens after import is unchanged from a manually-created draft:
 * everything lands in the normal Opportunities list at "Pending Review",
 * and the existing detailed form (AdminOpportunityFormPage) is the only
 * place verification status or publishing actually happens. This page
 * never sets verificationStatus and never publishes anything — that's
 * enforced server-side in adminOpportunityImportController.js regardless
 * of what this page sends.
 */
export default function AdminOpportunityImportPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("paste"); // "paste" | "review" | "result"
  const [researchText, setResearchText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [result, setResult] = useState(null);

  async function handleExtract() {
    setExtracting(true);
    setExtractError(null);
    try {
      const data = await extractOpportunitiesAdmin(researchText);
      const found = data.opportunities || [];
      setCandidates(found);
      // Default: everything without a "missing required field" flag is
      // pre-selected — a clean extraction shouldn't need the admin to
      // manually tick every box, but anything visibly incomplete starts
      // unchecked so it doesn't get imported by default.
      const preselected = new Set(
        found
          .filter((c) => !c.flags?.some((f) => f.toLowerCase().includes("missing")))
          .map((_, i) => i)
      );
      setSelected(preselected);
      setStep(found.length > 0 ? "review" : "paste");
      if (found.length === 0) {
        setExtractError("No opportunities were found in that text. Try pasting a more detailed research result.");
      }
    } catch (err) {
      setExtractError(err.message || "Extraction failed. Try again.");
    } finally {
      setExtracting(false);
    }
  }

  function toggle(i) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function handleImport() {
    const toImport = candidates
      .filter((_, i) => selected.has(i))
      // Build the payload from an explicit field list rather than
      // destructuring-to-omit — the backend schema doesn't know about
      // _importIndex/flags/verificationStatus (it always forces
      // verificationStatus itself regardless of what's sent).
      .map((c) => ({
        title: c.title,
        organization: c.organization,
        organizationLogoUrl: c.organizationLogoUrl,
        type: c.type,
        category: c.category,
        shortSummary: c.shortSummary,
        description: c.description,
        eligibility: c.eligibility,
        eligibleDegrees: c.eligibleDegrees,
        eligibleBranches: c.eligibleBranches,
        eligibleGraduationYears: c.eligibleGraduationYears,
        minYear: c.minYear,
        maxYear: c.maxYear,
        location: c.location,
        workMode: c.workMode,
        country: c.country,
        duration: c.duration,
        stipend: c.stipend,
        prize: c.prize,
        compensationNotes: c.compensationNotes,
        applicationDeadline: c.applicationDeadline,
        startDate: c.startDate,
        officialApplicationUrl: c.officialApplicationUrl,
        officialSourceUrl: c.officialSourceUrl,
      }));

    if (toImport.length === 0) return;

    setImporting(true);
    setImportError(null);
    try {
      const data = await importSelectedOpportunitiesAdmin(toImport);
      setResult(data);
      setStep("result");
    } catch (err) {
      setImportError(err.message || "Import failed. Try again.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <PageMeta title="Import Opportunities · Admin · Code Club" path="/admin/opportunities/import" />

      <button
        onClick={() => navigate("/admin/opportunities")}
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition mb-4"
      >
        <ArrowLeft size={12} strokeWidth={2} /> Opportunities
      </button>

      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={20} strokeWidth={2} className="text-[var(--theme-primary,#2dd4bf)]" />
        <h1 className="text-xl font-bold text-white">Import Opportunities</h1>
      </div>
      <p className="text-zinc-500 text-sm mb-6">
        Paste a research result — from Claude or elsewhere — and Code Club will extract candidate opportunities for
        you to review. Nothing is published automatically; everything lands as Pending Review.
      </p>

      {step === "paste" && (
        <>
          <textarea
            value={researchText}
            onChange={(e) => setResearchText(e.target.value)}
            placeholder="Paste research text here — e.g. a list of internships, hackathons, or fellowships with their details..."
            rows={14}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
          />
          {extractError && (
            <div className="mt-3 flex items-start gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              <AlertTriangle size={16} strokeWidth={2} className="flex-shrink-0 mt-0.5" />
              <span>{extractError}</span>
            </div>
          )}
          <div className="mt-4">
            <Button onClick={handleExtract} loading={extracting} disabled={!researchText.trim()}>
              Extract Opportunities
            </Button>
          </div>
        </>
      )}

      {step === "review" && (
        <>
          <p className="text-sm text-zinc-400 mb-4">
            Found <strong className="text-white">{candidates.length}</strong> opportunit
            {candidates.length === 1 ? "y" : "ies"}. Review and select which to import — you can edit any details
            afterward in the normal opportunity form.
          </p>

          <div className="space-y-3 mb-6">
            {candidates.map((c, i) => (
              <CandidateRow key={i} candidate={c} checked={selected.has(i)} onToggle={() => toggle(i)} />
            ))}
          </div>

          {importError && (
            <div className="mb-4 flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertTriangle size={16} strokeWidth={2} className="flex-shrink-0 mt-0.5" />
              <span>{importError}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button onClick={handleImport} loading={importing} disabled={selected.size === 0}>
              Import {selected.size > 0 ? `${selected.size} ` : ""}as Drafts
            </Button>
            <Button variant="secondary" onClick={() => setStep("paste")} disabled={importing}>
              Back
            </Button>
          </div>
        </>
      )}

      {step === "result" && result && (
        <div>
          {result.imported.length > 0 && (
            <div className="flex items-start gap-2 text-sm text-[var(--theme-primary,#2dd4bf)] bg-[var(--theme-primary,#2dd4bf)]/10 border border-[var(--theme-primary,#2dd4bf)]/20 rounded-lg px-3 py-2.5 mb-3">
              <CheckCircle2 size={16} strokeWidth={2} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  Imported {result.imported.length} opportunit{result.imported.length === 1 ? "y" : "ies"} as Pending
                  Review.
                </p>
                <ul className="mt-1 text-xs text-zinc-400 space-y-0.5">
                  {result.imported.map((o) => (
                    <li key={o._id}>
                      {o.ccId} — {o.title}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {result.failed.length > 0 && (
            <div className="flex items-start gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5 mb-4">
              <AlertTriangle size={16} strokeWidth={2} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  {result.failed.length} couldn't be imported — fix and re-paste, or add manually.
                </p>
                <ul className="mt-1 text-xs space-y-1">
                  {result.failed.map((f, i) => (
                    <li key={i}>
                      <span className="text-zinc-300">{f.title}:</span>{" "}
                      <span className="text-zinc-500">{f.errors.join("; ")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <Button onClick={() => navigate("/admin/opportunities")}>Go to Opportunities</Button>
        </div>
      )}
    </div>
  );
}

function CandidateRow({ candidate: c, checked, onToggle }) {
  const hasMissingFlag = c.flags?.some((f) => f.toLowerCase().includes("missing"));

  return (
    <label
      className={`flex items-start gap-3 bg-zinc-900 border rounded-xl px-4 py-3 cursor-pointer transition ${
        checked ? "border-[var(--theme-primary,#2dd4bf)]/40" : "border-zinc-800"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="mt-1 accent-[var(--theme-primary,#2dd4bf)] flex-shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-white font-semibold text-sm">{c.title || "(untitled)"}</p>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
            {TYPE_LABELS[c.type] || c.type}
          </span>
          {hasMissingFlag && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
              Needs attention
            </span>
          )}
        </div>
        <p className="text-zinc-500 text-xs mt-0.5">
          {c.organization || "(no organization)"}
          {c.applicationDeadline && ` · Deadline ${formatVerificationDate(c.applicationDeadline)}`}
        </p>
        {c.flags?.length > 0 && (
          <ul className="mt-2 space-y-1">
            {c.flags.map((f, i) => (
              <li key={i} className="text-[11px] text-amber-400 flex items-start gap-1.5">
                <AlertTriangle size={11} strokeWidth={2} className="flex-shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>
    </label>
  );
}
