import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Lightbulb, ListPlus } from "lucide-react";
import PageMeta from "../components/seo/PageMeta";
import DashboardLayout from "../layouts/DashboardLayout";
import SectionCard from "../components/ui/layout/SectionCard";
import EmptyState from "../components/ui/feedback/EmptyState";
import Button from "../components/ui/Button";
import { formatVerificationDate } from "../utils/formatVerificationDate";
import { submitContribution, fetchMyContributions } from "../services/contributionApi";

/**
 * ContributionsPage — student-facing submission form + "my contributions"
 * history for Contribution Infrastructure (Phase 2F). Structurally mirrors
 * AmbassadorPage.jsx (the only other "apply -> pending -> admin reviews"
 * student-facing flow in this codebase): same layout shell, same
 * loading/error handling, same input/button styling tokens
 * (bg-zinc-800 + border-zinc-700 + theme-primary focus ring).
 *
 * Two supported kinds only, matching the closed enum decided this session
 * (backend/models/Contribution.js, backend/schemas/contributionSchema.js):
 * "new_problem" and "testcase_improvement". Each renders its own field
 * set — see NewProblemForm / TestcaseImprovementForm below — rather than
 * one generic form, since the two payload shapes have nothing in common.
 */

const STATUS_STYLES = {
  pending: "bg-amber-500/10 text-amber-400",
  approved: "bg-[var(--theme-primary,#2dd4bf)]/10 text-[var(--theme-primary,#2dd4bf)]",
  rejected: "bg-red-500/10 text-red-400",
};

const KIND_LABELS = {
  new_problem: "New problem",
  testcase_improvement: "Testcase improvement",
};

export default function ContributionsPage() {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyContributions();
      setContributions(data.contributions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern used throughout this codebase (see AdminOpportunitiesPage.jsx's identical effect); load()'s setState calls happen after its own await, not synchronously here.
    load();
  }, []);

  return (
    <DashboardLayout>
      <PageMeta title="Contribute · Code Club" path="/contribute" />
      <div className="max-w-3xl mx-auto">
        <Link
          to="/club"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition mb-4"
        >
          <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
          Back to Club
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Contribute to Code Club</h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Submit a new problem or improve testcases on an existing one. Approved
            contributions are rewarded once reviewed.
          </p>
        </div>

        <SubmissionForm onSubmitted={load} />

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-3">
            Your contributions
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <SectionCard>
              <p className="text-zinc-500 text-sm">Loading…</p>
            </SectionCard>
          ) : contributions.length === 0 ? (
            <SectionCard>
              <EmptyState
                icon="🧩"
                title="No contributions yet"
                description="Submit your first one above — every submission shows up here."
                compact
              />
            </SectionCard>
          ) : (
            <div className="space-y-2">
              {contributions.map((c) => (
                <ContributionRow key={c._id} contribution={c} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function ContributionRow({ contribution }) {
  const { _id, kind, status, createdAt, rejectionReason, payload } = contribution;
  const title = kind === "new_problem" ? payload?.title : payload?.problemSlug;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">
              {KIND_LABELS[kind] || kind}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[status] || "bg-zinc-800 text-zinc-400"}`}>
              {status}
            </span>
          </div>
          <p className="text-white font-medium text-sm mt-1 truncate">{title || "Untitled"}</p>
        </div>
        <span className="flex-shrink-0 text-zinc-500 text-xs">
          {formatVerificationDate(createdAt)}
        </span>
      </div>
      {status === "rejected" && rejectionReason && (
        <p className="text-zinc-500 text-xs mt-2 border-t border-zinc-800 pt-2">
          {rejectionReason}
        </p>
      )}
      {/* Not surfaced anywhere else, and useful for a student trying to
          reference a specific submission (e.g. in a support message)
          without needing admin access — this is a key, not a secret, so
          showing it is fine. */}
      <p className="text-zinc-700 text-[10px] mt-1 font-mono">{_id}</p>
    </div>
  );
}

// ── Submission form ──────────────────────────────────────────────────────

function SubmissionForm({ onSubmitted }) {
  const [kind, setKind] = useState("new_problem");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Each form component below owns its own field state and exposes a
  // buildPayload() the parent calls on submit — keeps the two payload
  // shapes fully decoupled from each other (no shared/overloaded state).
  const [buildPayload, setBuildPayload] = useState(() => () => null);
  const [isValid, setIsValid] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) return;

    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await submitContribution(kind, payload);
      setSuccessMessage("Submitted — you'll see it below once it's reviewed.");
      onSubmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SectionCard title="New contribution">
      <div className="flex gap-2 mb-5">
        {Object.entries(KIND_LABELS).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setKind(value);
              setError(null);
              setSuccessMessage(null);
            }}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
              kind === value ? "bg-white text-black" : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {kind === "new_problem" ? (
          <NewProblemForm onChange={(fn, valid) => { setBuildPayload(() => fn); setIsValid(valid); }} />
        ) : (
          <TestcaseImprovementForm onChange={(fn, valid) => { setBuildPayload(() => fn); setIsValid(valid); }} />
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-[var(--theme-primary,#2dd4bf)]/10 border border-[var(--theme-primary,#2dd4bf)]/20 text-[var(--theme-primary,#2dd4bf)] text-sm rounded-xl px-4 py-3">
            {successMessage}
          </div>
        )}

        <Button type="submit" disabled={!isValid || submitting} loading={submitting} className="w-full">
          {submitting ? "Submitting…" : "Submit contribution"}
        </Button>
      </form>
    </SectionCard>
  );
}

const inputClass =
  "w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[var(--theme-primary,#2dd4bf)]/50";
const labelClass = "block text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1";

function Field({ label, children }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

// ── kind: new_problem ────────────────────────────────────────────────────
// Field set mirrors backend/schemas/contributionSchema.js's
// NewProblemPayloadSchema exactly: title, difficulty, topic, functionName,
// statement, examples[], testcases[].
function NewProblemForm({ onChange }) {
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [topic, setTopic] = useState("");
  const [functionName, setFunctionName] = useState("");
  const [statement, setStatement] = useState("");
  const [examples, setExamples] = useState([{ input: "", output: "", explanation: "" }]);
  const [testcases, setTestcases] = useState([{ input: "", expectedOutput: "" }]);

  useEffect(() => {
    const validExamples = examples.filter((e) => e.input.trim() && e.output.trim());
    const validTestcases = testcases.filter((t) => t.input.trim() !== "" && t.expectedOutput.trim() !== "");
    const valid =
      title.trim() && topic.trim() && functionName.trim() && statement.trim() &&
      validExamples.length > 0 && validTestcases.length > 0;

    onChange(() => {
      if (!valid) return null;
      return {
        title: title.trim(),
        difficulty,
        topic: topic.trim(),
        functionName: functionName.trim(),
        statement: statement.trim(),
        examples: validExamples.map((e) => ({
          input: e.input.trim(),
          output: e.output.trim(),
          ...(e.explanation.trim() ? { explanation: e.explanation.trim() } : {}),
        })),
        testcases: validTestcases.map((t) => ({ input: t.input.trim(), expectedOutput: t.expectedOutput.trim() })),
      };
    }, Boolean(valid));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onChange is a fresh callback from the parent every render by design (see SubmissionForm); including it here would loop.
  }, [title, difficulty, topic, functionName, statement, examples, testcases]);

  return (
    <>
      <Field label="Title">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Two Sum Variant" className={inputClass} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Difficulty">
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={inputClass}>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </Field>
        <Field label="Topic">
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Arrays" className={inputClass} />
        </Field>
      </div>

      <Field label="Function name">
        <input value={functionName} onChange={(e) => setFunctionName(e.target.value)} placeholder="e.g. twoSumVariant" className={inputClass} />
      </Field>

      <Field label="Problem statement">
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          rows={5}
          placeholder="Describe the problem, constraints, and expected behaviour."
          className={`${inputClass} resize-none`}
        />
      </Field>

      <RepeatableRows
        icon={<Lightbulb size={13} strokeWidth={2} />}
        label="Examples"
        rows={examples}
        setRows={setExamples}
        emptyRow={{ input: "", output: "", explanation: "" }}
        fields={[
          { key: "input", placeholder: "Input, e.g. [2,7,11,15], target=9" },
          { key: "output", placeholder: "Output, e.g. [0,1]" },
          { key: "explanation", placeholder: "Explanation (optional)", optional: true },
        ]}
      />

      <RepeatableRows
        icon={<ListPlus size={13} strokeWidth={2} />}
        label="Grading testcases"
        rows={testcases}
        setRows={setTestcases}
        emptyRow={{ input: "", expectedOutput: "" }}
        fields={[
          { key: "input", placeholder: "Input" },
          { key: "expectedOutput", placeholder: "Expected output" },
        ]}
      />
    </>
  );
}

// ── kind: testcase_improvement ───────────────────────────────────────────
// Field set mirrors TestcaseImprovementPayloadSchema exactly: problemSlug,
// testcases[], optional reason.
function TestcaseImprovementForm({ onChange }) {
  const [problemSlug, setProblemSlug] = useState("");
  const [testcases, setTestcases] = useState([{ input: "", expectedOutput: "" }]);
  const [reason, setReason] = useState("");

  useEffect(() => {
    const validTestcases = testcases.filter((t) => t.input.trim() !== "" && t.expectedOutput.trim() !== "");
    const valid = problemSlug.trim() && validTestcases.length > 0;

    onChange(() => {
      if (!valid) return null;
      return {
        problemSlug: problemSlug.trim(),
        testcases: validTestcases.map((t) => ({ input: t.input.trim(), expectedOutput: t.expectedOutput.trim() })),
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      };
    }, Boolean(valid));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see NewProblemForm's identical note above.
  }, [problemSlug, testcases, reason]);

  return (
    <>
      <Field label="Problem slug">
        <input
          value={problemSlug}
          onChange={(e) => setProblemSlug(e.target.value)}
          placeholder="e.g. two-sum — find this in the problem's URL"
          className={inputClass}
        />
      </Field>

      <RepeatableRows
        icon={<ListPlus size={13} strokeWidth={2} />}
        label="Testcases to add"
        rows={testcases}
        setRows={setTestcases}
        emptyRow={{ input: "", expectedOutput: "" }}
        fields={[
          { key: "input", placeholder: "Input" },
          { key: "expectedOutput", placeholder: "Expected output" },
        ]}
      />

      <Field label="Why this testcase matters (optional)">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="e.g. Misses an edge case with duplicate values."
          className={`${inputClass} resize-none`}
        />
      </Field>
    </>
  );
}

// ── Shared: add/remove row list, used by both examples and testcases ────
function RepeatableRows({ icon, label, rows, setRows, emptyRow, fields }) {
  function updateRow(index, key, value) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, { ...emptyRow }]);
  }
  function removeRow(index) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="flex items-center gap-1.5 text-xs text-zinc-500 uppercase tracking-widest font-semibold">
          {icon}
          {label}
        </label>
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-white transition"
        >
          <Plus size={13} strokeWidth={2} aria-hidden="true" />
          Add
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: `repeat(${fields.length}, minmax(0, 1fr))` }}>
              {fields.map((f) => (
                <input
                  key={f.key}
                  value={row[f.key]}
                  onChange={(e) => updateRow(index, f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[var(--theme-primary,#2dd4bf)]/50"
                />
              ))}
            </div>
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="flex-shrink-0 p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
                title="Remove"
              >
                <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}