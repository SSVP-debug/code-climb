import { useEffect, useState } from "react";
import { Radar } from "lucide-react";
import PageMeta from "../components/seo/PageMeta";
import OpportunityCard from "../components/opportunities/OpportunityCard";
import EmptyState from "../components/ui/feedback/EmptyState";
import { fetchOpportunities } from "../services/opportunityApi";

const TYPE_FILTERS = [
  { value: "", label: "All types" },
  { value: "internship", label: "Internships" },
  { value: "hackathon", label: "Hackathons" },
  { value: "research_internship", label: "Research Internships" },
  { value: "open_source_program", label: "Open Source Programs" },
  { value: "fellowship", label: "Fellowships" },
  { value: "coding_competition", label: "Coding Competitions" },
  { value: "student_program", label: "Student Programs" },
  { value: "scholarship", label: "Scholarships" },
  { value: "developer_program", label: "Developer Programs" },
];

// Public — no ProtectedRoute (PART 6/9 require this reachable to anyone,
// same as CertVerifyPage). Not in Navbar/ThemeGate since it's meant to
// work for logged-out visitors landing from a shared card.
export default function OpportunityRadarPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [type, setType] = useState("");
  const [closingSoon, setClosingSoon] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern used throughout this codebase's admin hooks (see src/hooks/useAdminProblems.js's fuller write-up); setLoading(true) here is synchronous by design, all other setState calls happen after the fetch's own await.
    setLoading(true);
    fetchOpportunities({ type, closingSoon })
      .then((data) => {
        if (!cancelled) setOpportunities(data.opportunities || []);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load opportunities right now.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type, closingSoon]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <PageMeta
        title="Opportunity Radar · Code Club"
        description="Verified internships, hackathons, fellowships, and student programs — discovered, verified, and curated by Code Club."
        path="/opportunities"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-2.5 mb-2">
          <Radar size={22} strokeWidth={2} className="text-[var(--theme-primary,#2dd4bf)]" />
          <h1 className="text-2xl sm:text-3xl font-black">Opportunity Radar</h1>
        </div>
        <p className="text-[var(--muted-foreground)] text-sm max-w-xl mb-8">
          Internships, hackathons, fellowships, and student programs — verified by Code Club before they're shared.
        </p>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--foreground)] rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--theme-primary,#2dd4bf)]"
          >
            {TYPE_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setClosingSoon((v) => !v)}
            className={`text-sm font-medium px-3 py-2 rounded-lg border transition ${
              closingSoon
                ? "bg-[var(--theme-primary,#2dd4bf)]/10 border-[var(--theme-primary,#2dd4bf)]/40 text-[var(--theme-primary,#2dd4bf)]"
                : "bg-[var(--surface)] border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            Closing soon
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[var(--theme-primary,#2dd4bf)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <EmptyState icon="⚠️" title="Something went wrong" description={error} compact />
        )}

        {!loading && !error && opportunities.length === 0 && (
          <EmptyState
            icon="📡"
            title="No opportunities right now"
            description="Check back soon — new verified opportunities are added regularly."
          />
        )}

        {!loading && !error && opportunities.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {opportunities.map((o) => (
              <OpportunityCard key={o.ccId} opportunity={o} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}