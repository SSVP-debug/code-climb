import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { apiFetch } from "../services/api";
import PageMeta from "../components/seo/PageMeta";
import { SUPPORT_EMAIL } from "../config/site.js";
import DashboardLayout from "../layouts/DashboardLayout";
import Button from "../components/ui/Button";
import { SendTestModal, ExpressInterestModal } from "../components/recruiter/RecruiterActionModals";
import { CheckCircle2, Info, Briefcase, Search } from "lucide-react";

const VALID_TABS = ["candidates", "tests"];

// Mirrors GRADUATION_YEARS in src/components/profile/RecruiterSnapshot.jsx
// (the field a candidate actually sets) — kept as a separate literal for
// the same react-refresh/only-export-components reason PREFERRED_ROLES
// below already documents. Keep in sync if that range changes.
const CURRENT_YEAR = new Date().getFullYear();
const GRADUATION_YEARS = Array.from({ length: 14 }, (_, i) => String(CURRENT_YEAR - 5 + i));

// Mirrors PREFERRED_ROLES in src/components/profile/RecruiterSnapshot.jsx
// (itself mirroring backend/controllers/userController.js) — kept as a
// separate literal here rather than an import because RecruiterSnapshot.jsx
// only exports a component (react-refresh/only-export-components forbids
// mixing in a constant export). Keep in sync if the source list changes.
const PREFERRED_ROLES = [
  "Backend",
  "Frontend",
  "Full Stack",
  "Mobile",
  "Data / ML",
  "DevOps",
  "QA",
  "Other",
];

const VERIFIED_EXPLANATION =
  "This candidate's solve count is cryptographically signed. If it were edited after signing, the signature would no longer match — so a checkmark means the number you see is provably the number that was signed, not a self-reported figure.";

function VerifiedInfoTooltip() {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        className="text-zinc-600 hover:text-zinc-400 transition"
        aria-label="What does verified mean?"
      >
        <Info size={12} strokeWidth={2} />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-10 top-full mt-2 right-0 w-56 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-[11px] leading-relaxed text-zinc-300 shadow-lg"
        >
          {VERIFIED_EXPLANATION}
        </span>
      )}
    </span>
  );
}

function FilterBar({ filters, onChange }) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <input placeholder="College domain (e.g. marwadiuniversity.ac.in)"
        value={filters.college} onChange={e => onChange("college", e.target.value)}
        className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[var(--theme-primary,#2dd4bf)]/50 w-72" />
      <input placeholder="Topic (e.g. Dynamic Programming)"
        value={filters.topic} onChange={e => onChange("topic", e.target.value)}
        className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[var(--theme-primary,#2dd4bf)]/50 w-56" />
      <input type="number" placeholder="Min solved" value={filters.minSolved}
        onChange={e => onChange("minSolved", e.target.value)}
        className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none w-28" />
      <input type="number" placeholder="Max solved" value={filters.maxSolved}
        onChange={e => onChange("maxSolved", e.target.value)}
        className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none w-28" />
      <select value={filters.preferredRole} onChange={e => onChange("preferredRole", e.target.value)}
        className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none w-44">
        <option value="">Any role</option>
        {PREFERRED_ROLES.map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <select value={filters.expectedGraduation} onChange={e => onChange("expectedGraduation", e.target.value)}
        className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white outline-none w-40">
        <option value="">Any grad year</option>
        {GRADUATION_YEARS.map(y => (
          <option key={y} value={y}>Grad {y}</option>
        ))}
      </select>
      <label className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300">
        <input type="checkbox" checked={filters.availableForWork}
          onChange={e => onChange("availableForWork", e.target.checked)} />
        Available now
      </label>
    </div>
  );
}

const STATUS_STYLES = {
  pending: "bg-zinc-800 text-zinc-400",
  in_progress: "bg-sky-500/10 text-sky-400",
  submitted: "bg-green-500/10 text-green-400",
  expired: "bg-red-500/10 text-red-400",
};


function TestResultsModal({ testId, onClose }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch(`/api/recruiter/skills-test/${testId}`);
        if (!cancelled) setResult(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load results.");
      }
    })();
    return () => { cancelled = true; };
  }, [testId]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {error ? (
          <p className="text-red-400 text-sm">{error}</p>
        ) : !result ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-[var(--theme-primary,#2dd4bf)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold text-white mb-1">Test Results</h3>
            <p className="text-zinc-500 text-sm mb-4">{result.candidateUsername}</p>

            <div className="flex items-center justify-between bg-zinc-800/60 rounded-xl px-4 py-3 mb-4">
              <span className="text-sm text-zinc-400">
                Solved {result.solvedSlugs?.length || 0} of {result.problemSlugs.length}
              </span>
              <span className="text-lg font-bold text-[var(--theme-primary,#2dd4bf)]">
                {result.score != null ? `${result.score}%` : "—"}
              </span>
            </div>

            <ul className="space-y-1.5 mb-4">
              {result.problemSlugs.map(slug => {
                const solved = (result.solvedSlugs || []).includes(slug);
                return (
                  <li key={slug} className="flex items-center gap-2 text-sm">
                    {solved
                      ? <CheckCircle2 size={14} strokeWidth={2} className="text-verdict-accept flex-shrink-0" aria-hidden="true" />
                      : <span className="w-3.5 h-3.5 rounded-full border border-zinc-700 flex-shrink-0" aria-hidden="true" />
                    }
                    <span className={solved ? "text-zinc-300" : "text-zinc-600"}>{slug}</span>
                  </li>
                );
              })}
            </ul>

            {result.note && (
              <p className="text-xs text-zinc-500 border-t border-zinc-800 pt-3 mb-4">
                Your note: "{result.note}"
              </p>
            )}

            <p className="text-xs text-zinc-600 mb-4">
              {result.submittedAt
                ? `Submitted ${new Date(result.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                : "Not yet submitted."}
            </p>

            <Button variant="secondary" size="sm" onClick={onClose} className="w-full">Close</Button>
          </>
        )}
      </div>
    </div>
  );
}

function SentTestsTab() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingId, setViewingId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await apiFetch("/api/recruiter/skills-tests");
        setTests(data.tests || []);
      } catch (err) {
        toast.error(err.message || "Failed to load sent tests.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[var(--theme-primary,#2dd4bf)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <p className="text-center text-zinc-600 py-12 text-sm">
        No skills tests sent yet — send one from the Candidates tab.
      </p>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="hidden sm:grid grid-cols-6 px-4 py-2 border-b border-zinc-800 text-[10px] text-zinc-600 uppercase tracking-widest">
        <span className="col-span-2">Candidate</span>
        <span>Problems</span>
        <span className="text-center">Status</span>
        <span className="text-center">Score</span>
        <span className="text-right">Sent</span>
      </div>
      {tests.map((t) => {
        const canViewResults = t.status === "submitted" || t.status === "expired";
        return (
          <div
            key={t.id}
            role={canViewResults ? "button" : undefined}
            tabIndex={canViewResults ? 0 : undefined}
            onClick={canViewResults ? () => setViewingId(t.id) : undefined}
            onKeyDown={canViewResults ? (e) => { if (e.key === "Enter") setViewingId(t.id); } : undefined}
            className={`grid grid-cols-2 gap-y-1 sm:grid-cols-6 sm:gap-y-0 sm:items-center px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/30 ${canViewResults ? "cursor-pointer" : ""}`}
          >
            <div className="col-span-2">
              <p className="text-sm text-white font-medium">{t.candidateUsername}</p>
              {t.note && <p className="text-xs text-zinc-500 truncate">{t.note}</p>}
            </div>
            <span className="text-xs text-zinc-400">{t.problemSlugs.length} problems</span>
            <span className="sm:text-center">
              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide ${STATUS_STYLES[t.status] || STATUS_STYLES.pending}`}>
                {t.status.replace("_", " ")}
              </span>
            </span>
            <span className="text-sm text-[var(--theme-primary,#2dd4bf)] font-semibold sm:text-center">
              {t.score != null ? `${t.score}%` : "—"}
            </span>
            <span className="text-xs text-zinc-500 sm:text-right">
              {canViewResults
                ? "View results →"
                : new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          </div>
        );
      })}
      {viewingId && <TestResultsModal testId={viewingId} onClose={() => setViewingId(null)} />}
    </div>
  );
}

export default function RecruiterDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Deep-linkable via ?tab=candidates|tests — same pattern as the TPO
  // dashboard, so the admin console (or anyone) can link straight to
  // either section instead of only the page's default view.
  const [tab, setTabState] = useState(() => {
    const fromUrl = searchParams.get("tab");
    return VALID_TABS.includes(fromUrl) ? fromUrl : "candidates";
  });

  function setTab(next) {
    setTabState(next);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("tab", next);
      return params;
    }, { replace: true });
  }

  const [candidates, setCandidates] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ college: "", topic: "", minSolved: "", maxSolved: "", preferredRole: "", expectedGraduation: "", availableForWork: false });
  const [selected, setSelected] = useState(null);
  const [interestTarget, setInterestTarget] = useState(null);
  const [pendingVerification, setPendingVerification] = useState(false);

  // fetchCandidates reads filters via this ref (always kept current, see
  // the render-time sync just below) rather than closing over the
  // `filters` state variable directly — that's what lets it be wrapped
  // in a genuinely stable useCallback([]) below, so the effect that
  // fetches on mount can correctly depend on it without exhaustive-deps
  // flagging a missing dependency, and without refetching on every
  // filter keystroke (filters are only applied via the explicit
  // "Search"/pagination calls below, by design).
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const fetchCandidates = useCallback(async (p = 1) => {
    try {
      setLoading(true);

      const currentFilters = filtersRef.current;
      const params = new URLSearchParams({
        page: p,
        limit: 20,
      });

      if (currentFilters.college) params.set("college", currentFilters.college);
      if (currentFilters.topic) params.set("topic", currentFilters.topic);
      if (currentFilters.minSolved) params.set("minSolved", currentFilters.minSolved);
      if (currentFilters.maxSolved) params.set("maxSolved", currentFilters.maxSolved);
      if (currentFilters.preferredRole) params.set("preferredRole", currentFilters.preferredRole);
      if (currentFilters.expectedGraduation) params.set("expectedGraduation", currentFilters.expectedGraduation);
      if (currentFilters.availableForWork) params.set("availableForWork", "true");

      const data = await apiFetch(`/api/recruiter/candidates?${params}`);

      setCandidates(data.candidates || []);
      setTotal(data.total || 0);
      setPage(p);
    } catch (err) {
      if (
        err.message ===
        "Your recruiter account is pending verification."
      ) {
        setPendingVerification(true);
        return;
      }

      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Standard "fetch on mount" pattern used throughout this codebase's
  // data-fetching hooks/pages: the called function is a useCallback-wrapped
  // async fetcher whose setState calls all happen after its own await, not
  // synchronously in this effect's body. react-hooks/set-state-in-effect
  // still flags the call site here because it can't see across the
  // function boundary. A real fix would mean adopting a data-fetching
  // library (React Query/SWR) or inlining every one of these fetchers —
  // out of scope for a lint-debt pass; suppressed and documented instead.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern: the called function is a useCallback-wrapped async fetcher that sets loading/data state after its own await, not synchronously; see src/hooks/useAdminSettings.js for the fullest write-up of this decision.
  useEffect(() => { fetchCandidates(1); }, [fetchCandidates]);

  function updateFilter(k, v) { setFilters(f => ({ ...f, [k]: v })); }

  if (pendingVerification) {
    return (
      <DashboardLayout>
        <PageMeta title="Verification Pending · Code Club Recruiter" path="/recruiter/dashboard" />
        <div className="flex items-center justify-center px-6 py-24">
          <div className="max-w-lg text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-4">
              <Briefcase size={28} strokeWidth={2} aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-black text-white">
              Recruiter Verification Pending
            </h1>

            <p className="mt-4 text-zinc-400">
              Your recruiter account has been created successfully.
            </p>

            <p className="text-zinc-500">
              Access will be enabled after an administrator verifies your account.
            </p>

            <p className="text-zinc-600 text-sm mt-6">
              Questions in the meantime? Reach out to {SUPPORT_EMAIL}.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageMeta title="Recruiter Portal · Code Club" path="/recruiter/dashboard" />
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--theme-primary,#2dd4bf)]/10 text-[var(--theme-primary,#2dd4bf)] flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <Briefcase size={18} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Recruiter Portal</h1>
            <p className="text-zinc-500 text-sm">
              {tab === "candidates" ? `${total} verified candidates found` : "Skills tests you've sent"}
            </p>
          </div>
        </div>

        {/* Tabs — same visual pattern as the TPO dashboard */}
        <div className="flex gap-2 mb-6">
          {VALID_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition ${
                tab === t ? "bg-[var(--theme-primary,#2dd4bf)] text-black" : "bg-zinc-900 text-zinc-400 border border-zinc-800"
              }`}
            >
              {t === "candidates" ? "Candidates" : "Sent Tests"}
            </button>
          ))}
        </div>

        {tab === "candidates" && (
          <>
            <FilterBar filters={filters} onChange={updateFilter} />
            <Button onClick={() => fetchCandidates(1)} className="mb-6">
              Search
            </Button>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[var(--theme-primary,#2dd4bf)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="hidden sm:grid sm:grid-cols-[2fr_0.7fr_0.7fr_1fr_1.8fr] px-4 py-2 border-b border-zinc-800 text-[10px] text-zinc-600 uppercase tracking-widest">
                  <span>Candidate</span>
                  <span className="text-center">Solved</span>
                  <span className="text-center">Hard</span>
                  <span className="text-center inline-flex items-center justify-center gap-1">
                    Verified <VerifiedInfoTooltip />
                  </span>
                  <span className="text-right">Action</span>
                </div>
                {candidates.length === 0 ? (
                  <div className="text-center py-16 text-zinc-600">
                    <Search size={28} strokeWidth={1.75} className="mx-auto mb-3" aria-hidden="true" />
                    <p className="text-sm">No candidates match your filters.</p>
                    <p className="text-xs mt-1">Try widening the college domain, dropping the min-solved bar, or clearing a role/grad-year filter.</p>
                  </div>
                ) : candidates.map(c => (
                  // grid-cols-2 on mobile (name+badges spans both, each stat
                  // gets its own cell) keeps the "div.grid" class present at
                  // every breakpoint — a 6-equal-column grid was unreadable
                  // below ~640px, squeezing the candidate's name/college
                  // into a sliver next to four cramped stat columns. At
                  // sm+, a weighted 5-column template (rather than 6 equal
                  // columns) replaces it — equal columns left the Action
                  // cell too narrow for View/Interested/Test to sit on one
                  // line even at desktop widths, wrapping them into an
                  // unnecessarily tall vertical stack.
                  <div key={c.username} className="grid grid-cols-2 gap-y-2 sm:grid-cols-[2fr_0.7fr_0.7fr_1fr_1.8fr] sm:gap-y-0 sm:items-center px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-sm text-white font-medium">{c.displayName}</p>
                      <p className="text-xs text-zinc-500">{c.college || "—"}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {c.availableForWork && (
                          <span className="text-[9px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded font-medium">
                            Open to work
                          </span>
                        )}
                        {c.expectedGraduation && (
                          <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                            Grad {c.expectedGraduation}
                          </span>
                        )}
                        {c.topTopics.map(t => (
                          <span key={t} className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-[var(--theme-primary,#2dd4bf)] font-semibold sm:text-center">
                      <span className="text-zinc-600 sm:hidden">Solved </span>{c.solvedCount}
                    </span>
                    <span className="text-sm text-red-400 sm:text-center">
                      <span className="text-zinc-600 sm:hidden">Hard </span>{c.hard}
                    </span>
                    <span className="flex sm:justify-center" title={c.isVerified ? VERIFIED_EXPLANATION : "Profile has not been signed yet."}>
                      <span className="text-zinc-600 sm:hidden mr-1">Verified</span>
                      {c.isVerified ? <CheckCircle2 size={15} strokeWidth={2} className="text-verdict-accept" aria-hidden="true" /> : <span className="text-sm">—</span>}
                    </span>
                    <div className="col-span-2 sm:col-span-1 text-right flex flex-wrap gap-2 justify-end">
                      <Button
                        href={`/u/${c.username}`}
                        target="_blank"
                        rel="noreferrer"
                        variant="secondary"
                        size="sm"
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setInterestTarget(c)}
                      >
                        Interested
                      </Button>
                      <Button size="sm" onClick={() => setSelected(c)}>
                        Test
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {total > 20 && (
              <div className="flex justify-center gap-3 mt-6">
                <button onClick={() => fetchCandidates(page - 1)} disabled={page === 1}
                  className="px-4 py-2 text-sm bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl disabled:opacity-40">← Prev</button>
                <span className="text-sm text-zinc-500 py-2">Page {page}</span>
                <button onClick={() => fetchCandidates(page + 1)} disabled={candidates.length < 20}
                  className="px-4 py-2 text-sm bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-xl disabled:opacity-40">Next →</button>
              </div>
            )}
          </>
        )}

        {tab === "tests" && <SentTestsTab />}
      </div>
      {selected && <SendTestModal candidate={selected} onClose={() => setSelected(null)} onSent={() => { }} />}
      {interestTarget && (
        <ExpressInterestModal
          candidate={interestTarget}
          onClose={() => setInterestTarget(null)}
          onSent={() => toast.success("Interest sent.")}
        />
      )}
    </DashboardLayout>
  );
}