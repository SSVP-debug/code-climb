# Adding (or removing) a language

The goal (per the Content & Execution Architecture spec, plan 010) is
for this to feel as close as possible to an on/off configuration
change. This runbook is that promise made concrete — a checklist, not
theory, distilled from actually doing it once (Phase 6 Batch 1,
TypeScript) and from the real bugs that surfaced along the way,
including ones only real CI caught. Follow it in order; each step notes
the real gotcha found at that step, if any.

## Before you start: is this language actually cheap?

Not every language costs the same. The deciding factor is **starter-code
paradigm**, not raw language popularity:

- **Structurally compatible with an existing language already
  registered** (e.g. TypeScript ⊃ JavaScript) → cheap. Driver-gen and
  starter-code backfill both reuse the existing language's logic almost
  entirely.
- **A genuinely different paradigm** (e.g. C's free-function-plus-malloc'd-
  out-params vs. every other registered language's `class Solution { ...
  }` OOP wrapper) → NOT cheap, regardless of how simple the language
  itself is. This was the real finding that redirected Phase 6 from C to
  TypeScript: the actual cost driver is whether **every one of the 250
  problems' starter code** needs a hand-considered new signature, not
  whether the driver-gen code itself is hard to write.

Check this **before** picking a language, by reading a few sample starter
files (`src/data/problems.js`, `starterCode.<existing-language>` for a
handful of problems) and asking: "does this language's idiomatic
function signature for the same problem look structurally like what's
already there, or fundamentally different?"

## The steps

### 1. Register in `backend/config/languages.js`

Add an entry to `LANGUAGES` with `enabled: false`. You need the real
Judge0 language ID for **your actual deployed instance** — not a
well-known public value copied from memory or docs. TypeScript's
`judge0Id: 74` was Judge0 CE's well-known public ID, and it went into
the registry unverified against this project's real instance because
this session had no network access to check.

**Run `node backend/scripts/verifyLanguageRegistry.js` before assuming
any ID is correct.** It queries your real `JUDGE0_API_URL` (same
auth/URL-derivation logic as `compilerController.js`, so "does this
reach the same instance production uses" is true by construction) and
cross-checks every registered language, not just the new one. Exits
non-zero if anything doesn't match.

### 2. Driver-gen in `backend/utils/generateDriverCode.js`

If the new language is structurally compatible with an already-registered
one (per the paradigm check above), reuse that language's argument-
formatting helper directly rather than writing a new one — TypeScript's
branch reuses `formatJsArg` verbatim, no `languageTypes/typescript.js`
module exists because there was no declared-variable step to extract
logic from. Only write a new `languageTypes/<lang>.js` module (mirroring
`java.js`/`cpp.js`) if the language actually needs its own declared-
variable/type-formatting logic — i.e., if it's NOT structurally
compatible with an existing entry.

**Critical, learned the hard way: `generateDriverCode.js` is NOT the
only driver-generation file.** `backend/utils/operationSequenceDriver.js`
is a completely separate driver-gen path for constructor/class-based
problems (anything with `Problem.operationSequence.enabled: true` —
LRU Cache, Trie-with-search, MyCalendar, etc.). TypeScript's Batch 1
only touched `generateDriverCode.js` and shipped believing the driver-gen
step was done — it wasn't. This file has its own per-language dispatch
function with its own `if (language === "...")` branches that need the
same new-language branch added, completely independently. **This went
undetected through multiple "done" checkpoints** (lint, full test suite,
even a direct "is this fully done?" review) **until `validateProblemContracts.js`
was actually run against the real catalog** (see step 7) — the unit-tier
mocked tests never exercise this path with a real problem's real
operation-sequence shape, so a missing branch here doesn't fail until
something actually calls `generateOperationSequenceDriver()` with the
new language. Check this file explicitly, in the same step as this one,
every time — don't assume "driver-gen" means only one file.

### 3. `Problem.starterCode` schema field

Add the new language as an **optional/defaulted** field — not required
like the original four — since most of the pipeline needs to tolerate
its absence until the backfill (step 5) has run. Touches three places
that must all agree: `backend/models/Problem.js` (Mongoose),
`backend/schemas/problemSchema.js`'s `ProblemFolderSchema` AND
`AdminProblemCreateSchema` (both, not just one — they're separate zod
schemas for two different write paths).

**Open architecture question, not yet resolved:** `starterCode` is
still 4(+1) fixed named schema fields, not a map. This was fine for a
5th language (TypeScript) reusing an established pattern, but **is
recommended to change to a map-shaped field before a 6th/7th language is
added** — a fixed-field schema means every new language is a schema
migration touching three files (per above) forever, whereas a map only
needs that once. Not changed yet because no second new language has
been added since TypeScript to justify the migration cost; revisit this
call when the next language after TypeScript is actually being
scoped, not preemptively.

### 4. Folder-import/export pipeline

Three files need to agree on the new field, always all three together:
- `backend/scripts/importProblems.js` — read `starter/<lang>.<ext>` with
  `.catch(() => "")`, not a hard `fs.readFile` (mirrors the field being
  optional).
- `backend/scripts/lib/problemFolderFiles.js` — the shared file-mapping
  logic used by BOTH the exporter and the drift-checker. Emit the new
  starter file **only when present** (`...(starters.<lang> ? {...} :
  {})`), not as an empty-string placeholder — an earlier pass on this
  forgot this step entirely and produced zero `typescript.ts` files
  until it was added.
- Re-run `exportProblemsToFolders.js`, then `checkProblemsFolderDrift.js`
  to confirm zero drift.

**Known trap, already hit once:** `backend/problems/` can silently
accumulate orphaned folders that no longer correspond to any entry in
`src/data/problems.js` (found 7 of them this session — stale duplicates
left behind by past slug renames). `checkProblemsFolderDrift.js` does
NOT catch these — it only diffs what's *expected* to exist, never flags
*extra* files. If a language's starter backfill script reports fewer
files updated than you expect, check for this before assuming the
backfill script itself is broken.

### 5. Backfill `src/data/problems.js`

`src/data/problems.js` (not `backend/problems/*`) is the actual single
source of truth — confirmed by `checkProblemsFolderDrift.js`'s own
header. Any backfill script must target this file, then regenerate the
folder mirror (step 4), never the other way around.

**`src/data/problems.js` is also not the only content collection.**
`src/data/code-club-edition/CCE-00N.js` (one file per mission, currently
8) is a separate, smaller collection — same `starterCode` shape, no
folder mirror to regenerate, seeded by its own script
(`seedCodeClubEdition.js`). It's easy to backfill this one only in your
head and forget it exists as a second target — this session's TypeScript
backfill missed it entirely on the first pass. Small enough (currently
8 files) that a dedicated script is overkill; just check
`grep -rn "javascript:" src/data/code-club-edition/*.js` and confirm the
new language got added to every hit.

If the language is structurally compatible with an existing one (step
1's cheap case), the backfill can be **mechanical** — see
`scripts/backfillTypescriptStarter.js` as the reference implementation.
Two real safety lessons from writing it:

- **Don't trust a single formatting assumption about a 6000+ line
  hand-authored file.** `src/data/problems.js` mixes a pretty-printed
  per-field-per-line format and a compact single-line-per-problem format
  (45 of 250 problems used the compact one). A first version of the
  backfill script assumed only the pretty-printed layout; its own
  count-mismatch safety check (comparing a regex match count against the
  real problem count from the *already-imported* module, not just
  trusting the regex) caught the discrepancy (205 matches vs. 250
  expected) before writing anything wrong. **Always include this kind of
  independent count-verification gate before any text transform of a
  hand-authored source file** — don't just trust that one regex pass
  worked.
- Re-import the module after writing and diff-check the actual field
  values, not just "did it parse" — confirms the transform did what it
  claimed, not just that it didn't crash.

### 6. Content-version-aware writes (if your project has this — see plan 010)

If `Problem.js` has version-tracking hooks (`pre("save")`/
`pre("findOneAndUpdate")` bumping a `contentVersion` on grading-contract
changes), **check what Mongoose major version this project runs before
writing any hook.** Mongoose 9 dropped legacy callback-style
(`function (next) { ... next(); }`) middleware entirely — hooks must be
promise-style with no `next` parameter. This project's hooks were
originally written in the legacy style and passed lint/`node --check`/
the full unit suite cleanly, because the unit tier mocks the Mongoose
model and never exercises real middleware — **only the real-Mongo
integration tier catches this class of bug, and that tier can't run in
a sandboxed environment**, so it silently shipped until a real CI run
caught it (`TypeError: next is not a function`, 34 failures). Check
`backend/node_modules/mongoose/package.json`'s version, or better, find
an already-working hook elsewhere in the codebase (`User.js`'s
`setEmailDomain` at time of writing) and match its exact style rather
than trusting general Mongoose-hook knowledge.

### 7. Tests

- Unit tier: extend `generateDriverCode.test.js` for the new driver-gen
  branch; extend `operationSequenceDriver.test.js` too (see step 2 —
  don't skip this one just because it feels like the same thing as
  `generateDriverCode.test.js`, it's a genuinely separate dispatch
  function); extend `languages.test.js` if you added anything beyond a
  registry entry; extend `compiler.test.js`'s `ENABLED_LANGUAGE_IDS` /
  `SUPPORTED_LANGUAGE_IDS` split test if this is the first time those
  two sets diverge for a new reason (they diverged for the first time
  ever at TypeScript's `enabled: false`).
- If you touch anything with real Mongoose middleware, write the
  integration-tier test too, even though it can't be run in a sandbox —
  it's still the only tier that will catch a middleware-style bug like
  the one in step 6, and it needs to exist for real CI to run at all.
- **Actually run `node backend/scripts/validateProblemContracts.js` and
  `node backend/scripts/auditProblemBankScan.js` against the real
  catalog before considering the language done.** These aren't optional
  extras — they're the only thing in this whole checklist that exercises
  every real problem's real starter code and real operation-sequence
  shape, rather than a handful of synthetic test fixtures. The
  `operationSequenceDriver.js` gap in step 2 (a driver-gen branch
  missing entirely) survived a full green test suite, clean lint, and a
  direct "is this done?" review — it was only found by actually running
  `validateProblemContracts.js` and watching it throw for real. Both
  scripts already derive their language list from
  `SUPPORTED_LANGUAGE_KEYS` (fixed this session, see plan 010's record —
  they used to hardcode the same stale 4-language list), so they'll
  cover a new language automatically; you just have to remember to
  actually run them, since nothing else in the CI pipeline does.

### 8. Flip `enabled: true`

Only after `verifyLanguageRegistry.js` (step 1) has actually been run
against your real Judge0 instance and reports a clean match. Frontend
wiring is automatic — `GET /api/languages` already excludes disabled
languages by construction, so nothing else needs to change once this
flips.

## What does NOT need to change

If any of these need touching for a language addition, something's
wrong with the registry pattern, not with the new language:

- `Submission.js`'s language enum deliberately stays on
  `SUPPORTED_LANGUAGE_KEYS`, not `ENABLED_LANGUAGE_KEYS` — a disabled
  language must never invalidate historical submissions that used it
  while it was enabled.
- No frontend `<select>` hardcoding — it derives from `GET /api/languages`.
  **Caveat found after this runbook's first draft claimed this was fully
  true:** a grep for the old language names across `src/` turned up SIX
  separate hardcoded spots this claim had missed, not one — the main
  problem editor's `<select>` and driver-gen call were always correct,
  but: `ProblemEditor.jsx`'s `tabSize` conditional, `ProblemForm.jsx`'s
  (admin problem-creation) own separate hardcoded language array,
  `InterviewModePage.jsx`'s own separate hardcoded `<select>` (missed
  entirely by the original `useLanguages()` rollout — a student-facing
  page, not just admin), and three duplicated `LANG_LABELS` display-name
  maps across profile/stats components. **Lesson: "no frontend
  hardcoding" needs to be verified by actually grep'ing for the old
  language names across the ENTIRE `src/` tree, in one pass, not
  file-by-file as you happen to think of them** — this session found
  the first two, believed the audit was done, then found four more on a
  second pass using the same grep more broadly. All six are fixed now
  (see `plans/010-language-expansion-scoping.md`'s record), but don't
  re-trust this bullet blindly for the next language either —
  re-check.
- Per the same lesson: **any per-language cosmetic/behavioral difference
  belongs in the registry as a real field** (see `editorIndentSize`),
  not as a growing `language === "x" ? a : b` conditional somewhere in
  the frontend — that pattern is exactly what a registry is supposed to
  replace, and it's easy to miss because it doesn't look like a
  "language list" the way a hardcoded array does.
- No controller/route beyond `generateDriverCode.js`'s one new branch.
- No admin UI changes — language enable/disable is a static-config-file
  change (deploy), not a database toggle, deliberately (see plan 010's
  "config vs. database" reasoning) — unlike `Problem.enabled`/
  `hiddenTestcaseSet.enabled`, which ARE database-backed because they
  need runtime, per-document admin control.
