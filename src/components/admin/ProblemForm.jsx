import { useState } from "react";
import Button from "../ui/Button";
import { DrawerSection } from "./command/SideDrawer";

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const SOURCE_TYPES = ["core", "variant", "original"];
const LANGUAGES = ["python", "javascript", "java", "cpp"];

const EMPTY_FORM = {
  title: "",
  slug: "",
  functionName: "",
  difficulty: "Easy",
  topic: "",
  pattern: "",
  sourceType: "core",
  estimatedTime: "",
  description: "",
  companies: "",
  constraints: "",
  examples: "[]",
  testcases: "[]",
  hiddentestcases: "[]",
  hints: "[]",
  editorial: "",
  starterCode: { python: "", javascript: "", java: "", cpp: "" },
};

// Fields represented as JSON-in-a-textarea rather than a bespoke dynamic
// list-editor widget per field. A pragmatic choice for an internal admin
// tool covering testcases/examples/hints (structured arrays) without
// building 4+ separate add/remove-row UIs — each is parsed and validated
// (server-side, via AdminProblemCreateSchema) on submit, with parse errors
// shown inline before the request is even sent.
const JSON_FIELDS = ["examples", "testcases", "hiddentestcases", "hints"];
// Comma-or-newline-separated plain text, converted to a string array.
const LIST_FIELDS = ["companies", "constraints"];

function problemToFormValues(problem) {
  if (!problem) return EMPTY_FORM;
  return {
    title: problem.title || "",
    slug: problem.slug || "",
    functionName: problem.functionName || "",
    difficulty: problem.difficulty || "Easy",
    topic: problem.topic || "",
    pattern: problem.pattern || "",
    sourceType: problem.sourceType || "core",
    estimatedTime: problem.estimatedTime || "",
    description: problem.description || "",
    companies: (problem.companies || []).join(", "),
    constraints: (problem.constraints || []).join("\n"),
    examples: JSON.stringify(problem.examples || [], null, 2),
    testcases: JSON.stringify(problem.testcases || [], null, 2),
    hiddentestcases: JSON.stringify(problem.hiddentestcases || [], null, 2),
    hints: JSON.stringify(problem.hints || [], null, 2),
    editorial: problem.editorial?.content || "",
    starterCode: {
      python: problem.starterCode?.python || "",
      javascript: problem.starterCode?.javascript || "",
      java: problem.starterCode?.java || "",
      cpp: problem.starterCode?.cpp || "",
    },
  };
}

// Builds the API payload from form state, parsing JSON/list fields and
// collecting parse errors instead of throwing — so the form can show every
// problem at once rather than one submit-fail-fix-resubmit cycle at a time.
function buildPayload(values) {
  const payload = {
    title: values.title,
    slug: values.slug,
    functionName: values.functionName,
    difficulty: values.difficulty,
    topic: values.topic,
    pattern: values.pattern,
    sourceType: values.sourceType,
    estimatedTime: values.estimatedTime,
    description: values.description,
    starterCode: values.starterCode,
    editorial: values.editorial,
  };
  const errors = {};

  for (const field of LIST_FIELDS) {
    payload[field] = values[field]
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  for (const field of JSON_FIELDS) {
    try {
      payload[field] = values[field].trim() ? JSON.parse(values[field]) : [];
    } catch {
      errors[field] = "Not valid JSON.";
    }
  }

  return { payload, errors };
}

function Field({ label, children, error, hint }) {
  return (
    <label className="block mb-4">
      <span className="block text-xs font-semibold text-[var(--muted-foreground)] mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-[var(--muted-foreground)] mt-1">{hint}</span>}
      {error && <span className="block text-[11px] text-red-400 mt-1">{error}</span>}
    </label>
  );
}

const inputClass =
  "w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--border-strong)] disabled:opacity-50 disabled:cursor-not-allowed";

export default function ProblemForm({ mode, initialProblem, onSubmit, onCancel, saving, serverIssues }) {
  const [values, setValues] = useState(() => problemToFormValues(initialProblem));
  const [localErrors, setLocalErrors] = useState({});

  const isCatalog = mode === "edit" && initialProblem?.adminSource === "catalog";

  function set(field, value) {
    setValues((v) => ({ ...v, [field]: value }));
  }

  function setStarterCode(lang, value) {
    setValues((v) => ({ ...v, starterCode: { ...v.starterCode, [lang]: value } }));
  }

  function issueFor(field) {
    return localErrors[field] || serverIssues?.find((i) => i.path === field)?.message;
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (isCatalog) {
      // Server enforces this too (400s any non-safelisted field) — this
      // is just to avoid a round-trip for the common case of a form the
      // admin hasn't touched non-safelisted fields on.
      onSubmit({ topic: values.topic, pattern: values.pattern, sourceType: values.sourceType });
      return;
    }

    const { payload, errors } = buildPayload(values);
    if (Object.keys(errors).length > 0) {
      setLocalErrors(errors);
      return;
    }
    setLocalErrors({});
    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit}>
      {isCatalog && (
        <div className="mb-5 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          This is a catalog problem — its content lives in{" "}
          <code className="bg-black/20 px-1 rounded">src/data/problems.js</code>. Only Topic, Pattern, and
          Source Type can be edited here, and even those will be overwritten by the next{" "}
          <code className="bg-black/20 px-1 rounded">npm run seed</code>.
        </div>
      )}

      <DrawerSection label="Problem identity">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Field label="Title" error={issueFor("title")}>
            <input
              className={inputClass}
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              disabled={isCatalog}
              required={!isCatalog}
            />
          </Field>
          <Field label="Slug" error={issueFor("slug")} hint="Lowercase, hyphenated — this becomes the URL.">
            <input
              className={`${inputClass} font-mono text-xs`}
              value={values.slug}
              onChange={(e) => set("slug", e.target.value)}
              disabled={isCatalog || mode === "edit"}
              required={!isCatalog}
            />
          </Field>
          <Field label="Function name" error={issueFor("functionName")}>
            <input
              className={`${inputClass} font-mono text-xs`}
              value={values.functionName}
              onChange={(e) => set("functionName", e.target.value)}
              disabled={isCatalog}
              required={!isCatalog}
            />
          </Field>
        </div>
      </DrawerSection>

      <DrawerSection label="Difficulty & source">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Field label="Difficulty" error={issueFor("difficulty")}>
            <select
              className={inputClass}
              value={values.difficulty}
              onChange={(e) => set("difficulty", e.target.value)}
              disabled={isCatalog}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Topic" error={issueFor("topic")}>
            <input className={inputClass} value={values.topic} onChange={(e) => set("topic", e.target.value)} required />
          </Field>
          <Field label="Pattern" error={issueFor("pattern")}>
            <input className={inputClass} value={values.pattern} onChange={(e) => set("pattern", e.target.value)} />
          </Field>
          <Field label="Source type" error={issueFor("sourceType")}>
            <select className={inputClass} value={values.sourceType} onChange={(e) => set("sourceType", e.target.value)}>
              {SOURCE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Estimated time" error={issueFor("estimatedTime")} hint='e.g. "10–15 min"'>
            <input
              className={inputClass}
              value={values.estimatedTime}
              onChange={(e) => set("estimatedTime", e.target.value)}
              disabled={isCatalog}
            />
          </Field>
        </div>
      </DrawerSection>

      <DrawerSection label="Content">
        <Field label="Description" error={issueFor("description")}>
          <textarea
            className={`${inputClass} min-h-[120px] font-mono`}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            disabled={isCatalog}
            required={!isCatalog}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Field label="Companies" hint="Comma or newline separated.">
            <textarea
              className={`${inputClass} min-h-[70px]`}
              value={values.companies}
              onChange={(e) => set("companies", e.target.value)}
              disabled={isCatalog}
            />
          </Field>
          <Field label="Constraints" hint="One per line.">
            <textarea
              className={`${inputClass} min-h-[70px]`}
              value={values.constraints}
              onChange={(e) => set("constraints", e.target.value)}
              disabled={isCatalog}
            />
          </Field>
        </div>

        <Field label="Examples (JSON array)" error={issueFor("examples")} hint='[{ "input": "...", "output": "...", "explanation": "..." }]'>
          <textarea
            className={`${inputClass} min-h-[100px] font-mono`}
            value={values.examples}
            onChange={(e) => set("examples", e.target.value)}
            disabled={isCatalog}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Field label="Visible testcases (JSON array)" error={issueFor("testcases")}>
            <textarea
              className={`${inputClass} min-h-[100px] font-mono`}
              value={values.testcases}
              onChange={(e) => set("testcases", e.target.value)}
              disabled={isCatalog}
            />
          </Field>
          <Field label="Hidden testcases (JSON array)" error={issueFor("hiddentestcases")} hint="Never sent to the client.">
            <textarea
              className={`${inputClass} min-h-[100px] font-mono`}
              value={values.hiddentestcases}
              onChange={(e) => set("hiddentestcases", e.target.value)}
              disabled={isCatalog}
            />
          </Field>
        </div>

        <Field label="Starter code" error={issueFor("starterCode")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LANGUAGES.map((lang) => (
              <div key={lang}>
                <span className="block text-[11px] text-[var(--muted-foreground)] mb-1 capitalize font-mono">{lang}</span>
                <textarea
                  className={`${inputClass} min-h-[80px] font-mono text-xs`}
                  value={values.starterCode[lang]}
                  onChange={(e) => setStarterCode(lang, e.target.value)}
                  disabled={isCatalog}
                />
              </div>
            ))}
          </div>
        </Field>

        <Field label="Hints (JSON array)" error={issueFor("hints")} hint='[{ "level": 1, "text": "..." }]'>
          <textarea
            className={`${inputClass} min-h-[80px] font-mono`}
            value={values.hints}
            onChange={(e) => set("hints", e.target.value)}
            disabled={isCatalog}
          />
        </Field>

        <Field label="Editorial">
          <textarea
            className={`${inputClass} min-h-[100px] font-mono`}
            value={values.editorial}
            onChange={(e) => set("editorial", e.target.value)}
            disabled={isCatalog}
          />
        </Field>
      </DrawerSection>

      <div className="flex items-center justify-end gap-2 mt-2 pt-4 border-t border-[var(--border)]">
        <Button type="button" size="sm" variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" size="sm" loading={saving} disabled={saving}>
          {mode === "create" ? "Create problem" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}