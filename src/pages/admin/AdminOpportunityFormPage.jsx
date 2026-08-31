import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageMeta from "../../components/seo/PageMeta";
import Button from "../../components/ui/Button";
import {
  fetchOpportunityAdmin,
  createOpportunityAdmin,
  updateOpportunityAdmin,
} from "../../services/opportunityApi";

const TYPES = [
  ["internship", "Internship"],
  ["hackathon", "Hackathon"],
  ["research_internship", "Research Internship"],
  ["open_source_program", "Open Source Program"],
  ["fellowship", "Fellowship"],
  ["coding_competition", "Coding Competition"],
  ["student_program", "Student Program"],
  ["scholarship", "Scholarship"],
  ["developer_program", "Developer Program"],
  ["entry_level_job", "Entry-Level Job"],
  ["other", "Other"],
];

const WORK_MODES = [
  ["remote", "Remote"],
  ["hybrid", "Hybrid"],
  ["onsite", "Onsite"],
];

const EMPTY_FORM = {
  title: "",
  organization: "",
  organizationLogoUrl: "",
  type: "internship",
  category: "",
  shortSummary: "",
  description: "",
  eligibility: "",
  eligibleDegrees: "",
  eligibleBranches: "",
  eligibleGraduationYears: "",
  minYear: "",
  maxYear: "",
  location: "",
  workMode: "remote",
  country: "",
  stipend: "",
  prize: "",
  compensationNotes: "",
  duration: "",
  applicationDeadline: "",
  startDate: "",
  officialApplicationUrl: "",
  officialSourceUrl: "",
  verificationStatus: "unverified",
  verificationNotes: "",
};

function toDateInputValue(isoOrNull) {
  if (!isoOrNull) return "";
  return new Date(isoOrNull).toISOString().slice(0, 10);
}

function opportunityToFormValues(o) {
  if (!o) return EMPTY_FORM;
  return {
    title: o.title || "",
    organization: o.organization || "",
    organizationLogoUrl: o.organizationLogoUrl || "",
    type: o.type || "internship",
    category: o.category || "",
    shortSummary: o.shortSummary || "",
    description: o.description || "",
    eligibility: o.eligibility || "",
    eligibleDegrees: (o.eligibleDegrees || []).join(", "),
    eligibleBranches: (o.eligibleBranches || []).join(", "),
    eligibleGraduationYears: (o.eligibleGraduationYears || []).join(", "),
    minYear: o.minYear ?? "",
    maxYear: o.maxYear ?? "",
    location: o.location || "",
    workMode: o.workMode || "remote",
    country: o.country || "",
    stipend: o.stipend || "",
    prize: o.prize || "",
    compensationNotes: o.compensationNotes || "",
    duration: o.duration || "",
    applicationDeadline: toDateInputValue(o.applicationDeadline),
    startDate: toDateInputValue(o.startDate),
    officialApplicationUrl: o.officialApplicationUrl || "",
    officialSourceUrl: o.officialSourceUrl || "",
    verificationStatus: o.verificationStatus || "unverified",
    verificationNotes: o.verificationNotes || "",
  };
}

// Parses comma-separated free text into a trimmed non-empty string array —
// same convention as ProblemForm.jsx's LIST_FIELDS handling.
function toList(str) {
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildPayload(values) {
  return {
    title: values.title,
    organization: values.organization,
    organizationLogoUrl: values.organizationLogoUrl || null,
    type: values.type,
    category: values.category,
    shortSummary: values.shortSummary,
    description: values.description,
    eligibility: values.eligibility,
    eligibleDegrees: toList(values.eligibleDegrees),
    eligibleBranches: toList(values.eligibleBranches),
    eligibleGraduationYears: toList(values.eligibleGraduationYears)
      .map((y) => parseInt(y, 10))
      .filter((y) => !Number.isNaN(y)),
    minYear: values.minYear === "" ? null : parseInt(values.minYear, 10),
    maxYear: values.maxYear === "" ? null : parseInt(values.maxYear, 10),
    location: values.location,
    workMode: values.workMode,
    country: values.country,
    stipend: values.stipend,
    prize: values.prize,
    compensationNotes: values.compensationNotes,
    duration: values.duration,
    applicationDeadline: values.applicationDeadline || null,
    startDate: values.startDate || null,
    officialApplicationUrl: values.officialApplicationUrl,
    officialSourceUrl: values.officialSourceUrl,
    verificationStatus: values.verificationStatus,
    verificationNotes: values.verificationNotes,
  };
}

function Field({ label, children, error, hint, required }) {
  return (
    <label className="block mb-4">
      <span className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-[var(--muted-foreground)] mt-1">{hint}</span>}
      {error && <span className="block text-[11px] text-red-400 mt-1">{error}</span>}
    </label>
  );
}

const inputClass =
  "w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--theme-primary,#2dd4bf)] disabled:opacity-50";

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold text-[var(--foreground)] mb-4 pb-2 border-b border-[var(--border)]">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">{children}</div>
    </div>
  );
}

export default function AdminOpportunityFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [values, setValues] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [ccId, setCcId] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    fetchOpportunityAdmin(id)
      .then((data) => {
        setValues(opportunityToFormValues(data.opportunity));
        setCcId(data.opportunity.ccId);
      })
      .catch(() => setError("Failed to load opportunity."))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function set(field, value) {
    setValues((v) => ({ ...v, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload(values);
      if (isEdit) {
        await updateOpportunityAdmin(id, payload);
      } else {
        await createOpportunityAdmin(payload);
      }
      navigate("/admin/opportunities");
    } catch (err) {
      setError(err.message || "Failed to save opportunity.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-[var(--theme-primary,#2dd4bf)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <PageMeta title={`${isEdit ? "Edit" : "New"} Opportunity · Admin · Code Club`} path="/admin/opportunities" />

      <div className="mb-6">
        <h1 className="text-xl font-bold text-[var(--foreground)]">
          {isEdit ? `Edit ${ccId || "Opportunity"}` : "New Opportunity"}
        </h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-0.5">
          {isEdit
            ? "Changes save as a draft edit — status transitions happen from the opportunities list."
            : "A CC/0xx ID is allocated automatically once you save this as a draft."}
        </p>
      </div>

      {error && (
        <div className="mb-5 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Section title="Core content">
          <Field label="Title" required>
            <input className={inputClass} value={values.title} onChange={(e) => set("title", e.target.value)} required />
          </Field>
          <Field label="Organization" required>
            <input className={inputClass} value={values.organization} onChange={(e) => set("organization", e.target.value)} required />
          </Field>
          <Field label="Type" required>
            <select className={inputClass} value={values.type} onChange={(e) => set("type", e.target.value)}>
              {TYPES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category" required hint="e.g. Software Engineering">
            <input className={inputClass} value={values.category} onChange={(e) => set("category", e.target.value)} required />
          </Field>
          <Field label="Organization logo URL" hint="Optional">
            <input className={inputClass} value={values.organizationLogoUrl} onChange={(e) => set("organizationLogoUrl", e.target.value)} />
          </Field>
        </Section>

        <Section title="Description">
          <div className="sm:col-span-2">
            <Field label="Short summary" required hint="Max 220 characters — shown on cards and the share card.">
              <textarea
                className={inputClass}
                rows={2}
                maxLength={220}
                value={values.shortSummary}
                onChange={(e) => set("shortSummary", e.target.value)}
                required
              />
            </Field>
            <Field label="Full description" required>
              <textarea
                className={inputClass}
                rows={6}
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
                required
              />
            </Field>
          </div>
        </Section>

        <Section title="Eligibility">
          <div className="sm:col-span-2">
            <Field label="Eligibility summary" hint="Free text">
              <textarea className={inputClass} rows={2} value={values.eligibility} onChange={(e) => set("eligibility", e.target.value)} />
            </Field>
          </div>
          <Field label="Eligible degrees" hint="Comma-separated, e.g. B.Tech, M.Tech">
            <input className={inputClass} value={values.eligibleDegrees} onChange={(e) => set("eligibleDegrees", e.target.value)} />
          </Field>
          <Field label="Eligible branches" hint="Comma-separated, e.g. CSE, IT, ECE">
            <input className={inputClass} value={values.eligibleBranches} onChange={(e) => set("eligibleBranches", e.target.value)} />
          </Field>
          <Field label="Eligible graduation years" hint="Comma-separated, e.g. 2026, 2027">
            <input className={inputClass} value={values.eligibleGraduationYears} onChange={(e) => set("eligibleGraduationYears", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min year">
              <input type="number" min="1" max="6" className={inputClass} value={values.minYear} onChange={(e) => set("minYear", e.target.value)} />
            </Field>
            <Field label="Max year">
              <input type="number" min="1" max="6" className={inputClass} value={values.maxYear} onChange={(e) => set("maxYear", e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="Location & compensation">
          <Field label="Location" hint="e.g. Bengaluru, India">
            <input className={inputClass} value={values.location} onChange={(e) => set("location", e.target.value)} />
          </Field>
          <Field label="Work mode">
            <select className={inputClass} value={values.workMode} onChange={(e) => set("workMode", e.target.value)}>
              {WORK_MODES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Country">
            <input className={inputClass} value={values.country} onChange={(e) => set("country", e.target.value)} />
          </Field>
          <Field label="Duration" hint="e.g. 8 weeks">
            <input className={inputClass} value={values.duration} onChange={(e) => set("duration", e.target.value)} />
          </Field>
          <Field label="Stipend" hint="e.g. ₹40,000/month">
            <input className={inputClass} value={values.stipend} onChange={(e) => set("stipend", e.target.value)} />
          </Field>
          <Field label="Prize" hint="e.g. ₹1,00,000">
            <input className={inputClass} value={values.prize} onChange={(e) => set("prize", e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Compensation notes" hint="Optional — extra detail beyond stipend/prize">
              <input className={inputClass} value={values.compensationNotes} onChange={(e) => set("compensationNotes", e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="Timing">
          <Field label="Application deadline" hint="Leave blank for no deadline">
            <input type="date" className={inputClass} value={values.applicationDeadline} onChange={(e) => set("applicationDeadline", e.target.value)} />
          </Field>
          <Field label="Start date">
            <input type="date" className={inputClass} value={values.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </Field>
        </Section>

        <Section title="Links">
          <div className="sm:col-span-2">
            <Field
              label="Official application URL"
              required
              hint="The Apply button on the public page always uses this URL — the organization's own application."
            >
              <input
                type="url"
                className={inputClass}
                value={values.officialApplicationUrl}
                onChange={(e) => set("officialApplicationUrl", e.target.value)}
                placeholder="https://..."
                required
              />
            </Field>
            <Field label="Official source / verification URL" required hint="Where you verified this opportunity — shown to admins only.">
              <input
                type="url"
                className={inputClass}
                value={values.officialSourceUrl}
                onChange={(e) => set("officialSourceUrl", e.target.value)}
                placeholder="https://..."
                required
              />
            </Field>
          </div>
        </Section>

        <Section title="Verification">
          <Field label="Verification status">
            <select className={inputClass} value={values.verificationStatus} onChange={(e) => set("verificationStatus", e.target.value)}>
              <option value="unverified">Unverified</option>
              <option value="verified">Verified</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Verification notes" hint="Admin-only — never shown on the public page.">
              <textarea className={inputClass} rows={3} value={values.verificationNotes} onChange={(e) => set("verificationNotes", e.target.value)} />
            </Field>
          </div>
        </Section>

        <div className="flex items-center gap-2 mt-6">
          <Button type="submit" loading={saving}>
            {isEdit ? "Save changes" : "Create draft"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate("/admin/opportunities")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}