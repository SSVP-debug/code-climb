# Phase 6 — Language Expansion, Scoping

Written before any implementation, per this repo's own convention (every
phase starts with a scoping doc surfacing open product/business
decisions rather than Claude inferring them). No code changed in this
doc's session.

## What "adding a language" actually costs here

`backend/config/languages.js`'s own header already documents the four
real steps (register → write driver-generation code → extend
`starterCode` → flip `enabled: true`). This session's audit quantifies
what those steps mean concretely, because the honest cost is much
larger than "add a config entry":

1. **Register in `LANGUAGES`** — trivial, one object entry + Judge0 ID.
2. **Driver-generation code** — `backend/utils/generateDriverCode.js` +
   `languageTypes/*.js`. Python and JavaScript are dynamically typed and
   need no per-language type-declaration module. Java and C++ each have
   a hand-written `languageTypes/{lang}.js` doing type declarations
   (arrays, nested generics, etc.) — this is real, non-mechanical
   engineering per statically-typed language, not boilerplate.
3. **`Problem.starterCode`** — currently 4 fixed named schema fields
   (`python`/`javascript`/`java`/`cpp`), not a map. Adding a language
   means a schema change AND writing actual starter-code content **for
   every existing problem** that should support it.
4. **Flip `enabled: true`** — trivial once 1–3 are done.

Step 3 is the real scope question. **This checkout has 771 problems**
(`backend/problems/`). Backfilling starter code for a new language
across the existing catalog is a content task on that order, not an
engineering task — no config flag or migration script produces correct
per-problem starter function signatures by itself.

## Open decisions (need your call before Batch 1)

### 1. Which language(s), and in what order

Judge0 IDs for the languages most likely to come up for a DSA/placement
audience, statically vs. dynamically typed (dynamically typed = same
cheap path Python/JS already are; statically typed = needs its own
`languageTypes/*.js` module, same cost class as Java/C++):

| Language | Judge0 ID | Typing | Notes |
|---|---|---|---|
| C | 50 | Static | Very common ask from an Indian CS-curriculum audience specifically (many colleges teach C before C++) |
| Go | 95 | Static | Growing interview relevance, simpler type system than C++/Java |
| Rust | 73 | Static | Interview relevance rising, but generics/ownership make driver-gen the most involved of this list |
| C# | 51 | Static | Relevant if any target colleges lean .NET |
| Kotlin | 78 | Static | Android-adjacent audience overlap |
| TypeScript | 74 | Static (structurally) | Reuses most of the JS driver logic — cheaper than the fully-static options above |
| Ruby | 72 | Dynamic | Cheap engineering cost, unclear demand fit for this audience |

I don't have a signal on which of these your users are actually asking
for — that's a product call, not something the codebase or test suite
can tell me. My instinct, ranked by (demand for this audience) ÷
(engineering + content cost), would put **C** first (huge overlap with
existing C++ driver logic, and directly matches what Indian engineering
curricula teach before C++) — but this is a guess, not a recommendation
I'd want to build against silently.

### 2. Starter-code backfill strategy for the 771 existing problems

Three real options, not mutually exclusive:

- **Ship enabled with gaps.** New language goes live catalog-wide
  immediately; problems without starter code for it show an empty
  editor (or a generic function-signature stub) until backfilled.
  Fastest to ship, worst first-run experience on un-backfilled problems.
- **Backfill-then-ship.** Keep `enabled: false` until some coverage
  threshold (e.g. top N most-attempted problems, or 100%) is hit.
  Best experience, slowest to ship anything.
- **Route backfill through Contribution.** Phase 2F's `Contribution`
  model has a closed kind enum (`new_problem`, `testcase_improvement`
  today). A new kind (e.g. `starter_code_translation`) would let
  community contributors backfill per-problem starter code the same
  way they already contribute new problems — turns a one-time content
  task into an ongoing, reward-eligible one. Real option, but it's a
  taxonomy change to an existing closed enum, and needs its own
  approval-workflow shape decided (this is its own small scoping
  question if you want to go this route).

### 3. Driver-generation correctness bar

Java/C++ driver-gen already has hand-written edge-case handling (see
`generateDriverCode.js`'s own comments on e.g. boolean argument
formatting bugs found during a past audit). A new statically-typed
language's `languageTypes/*.js` module needs the same kind of care —
worth deciding up front whether Batch 1 ships with a narrow type
surface (ints/strings/arrays only, matching what most existing problems
actually need) versus trying to match Java/C++'s full current
generics/nested-type coverage from day one. Narrower-first with a
documented follow-up list is the lower-risk default unless you want
otherwise.

## Proposed batch sequence (pending decisions above)

1. Register language(s) in `languages.js` with `enabled: false`; write
   `languageTypes/{lang}.js` + wire into `generateDriverCode.js`; unit
   tests mirroring `java.test.js`/`cpp.test.js`'s coverage shape.
2. `Problem.starterCode` schema change (map or additional named fields
   — named fields matches existing convention, a map is more scalable
   for N>6 languages; worth deciding now given decision #1 could mean
   more than one language).
3. Backfill starter code per decision #2 above.
4. Flip `enabled: true`, frontend `<select>`/editor wiring (already
   mostly generic per this file's own header — fetches
   `GET /api/languages` rather than hardcoding).

Nothing above is started. Batch 1 doesn't begin until 1–3 are decided.

---

## Decisions made (this session)

- **Language: TypeScript first**, not C. C was the original instinct
  (curriculum fit) but the real cost turned out to be much higher than
  "reuse the C++ driver logic": every existing starter is a `class
  Solution { ... }` OOP wrapper, and C has no classes — a C driver needs
  a genuinely different free-function convention (explicit array-length
  params, malloc'd out-params for array returns), not a mechanical port.
  TypeScript is a structural superset of JS, so it reuses the existing
  JS call-and-print driver shape and the existing JS starter content
  almost entirely. Bunny's instruction was "make sure users should not
  feel inconvenience" — TypeScript was the option that could ship with
  zero starter-code gaps across the whole catalog, mechanically.
- **Backfill: mechanical, not phased/community-sourced.** Every existing
  `javascript` starter is already valid (or trivially valid) TypeScript,
  so `scripts/backfillTypescriptStarter.js` copies it byte-for-byte
  rather than requiring hand-authored or Contribution-sourced content.
  Full 250/250 catalog coverage at ship time — no empty-editor gap, no
  waiting on community backfill.

## Batch 1 — done this session

- Registered `typescript` in `backend/config/languages.js` (Judge0 ID
  74 — the well-known Judge0 CE id for TypeScript 3.7.4, **not yet
  confirmed against this deployment's actual Judge0 instance**),
  `enabled: false`.
- `generateDriverCode.js` — new `typescript` branch. Reuses `formatJsArg`
  and the JS call-and-print pattern directly; no separate
  `languageTypes/typescript.js` module, unlike java.js/cpp.js, since
  there's no declared-variable step to extract logic from.
- `Problem.js` (Mongoose) + both zod schemas (`ProblemFolderSchema`,
  `AdminProblemCreateSchema`) — added `starterCode.typescript` as
  optional/defaulted, not required (unlike the four existing languages),
  since most of the pipeline needed to tolerate its absence until the
  backfill script ran.
- `importProblems.js` — reads `starter/typescript.ts` if present,
  `.catch(() => "")` if not (mirrors the schema's optional-ness).
- `scripts/backfillTypescriptStarter.js` (new) — one-time, idempotent
  text transform of `src/data/problems.js` (confirmed via
  `checkProblemsFolderDrift.js`'s own header to be the actual source of
  truth, not `backend/problems/*`). Its own safety check caught a real
  bug before writing anything: the file mixes a pretty-printed
  per-field-per-line format and a compact single-line-per-problem
  format (45 of 250 problems use the compact one) — an earlier version
  of the script assumed only the pretty-printed layout and its
  count-mismatch guard (205 regex matches vs. 250 expected) caught that.
  Fixed to match the `javascript: `...`, ... java:` boundary
  format-agnostically. Ran for real: **250/250 problems backfilled**,
  verified byte-identical to their `javascript` starter via re-import.
- `scripts/lib/problemFolderFiles.js` (shared by the exporter and
  `checkProblemsFolderDrift.js`) — added `typescript` to the emitted
  file set, only when present (not an empty-string placeholder).
- Ran `exportProblemsToFolders.js` to regenerate the derived mirror —
  **250/250 `starter/typescript.ts` files created**,
  `checkProblemsFolderDrift.js` reports zero drift.
- Test coverage added: 4 new cases in `generateDriverCode.test.js`
  (`typescript` branch reuses the JS shape, reuses `formatJsArg` for
  argument formatting, the RUNTIME_ERROR catch-block message, and the
  still-correct `Unsupported language` throw for anything unregistered).
- **Found and fixed a real pre-existing test gap**, not caused by a bug
  in this phase's code: `routes/compiler.test.js` iterated
  `SUPPORTED_LANGUAGE_IDS` and asserted every one was accepted by
  `runCodeSchema` — true before this phase (supported and enabled were
  always the same set), false now that `typescript` is registered but
  disabled. `compiler.js`'s own schema was already correctly gating on
  `ENABLED_LANGUAGE_IDS` per its own comment; only the test's assumption
  was stale. Rewrote the test to assert against `ENABLED_LANGUAGE_IDS`
  and added an explicit case asserting `typescript` (74) is correctly
  rejected while disabled.
- Full verification: backend `npx vitest run` → **101/101 files,
  1131/1131 tests** (1126 baseline + 4 new TS driver-gen tests + 1 new
  disabled-language test). Frontend `npx vitest run` → **63/63, 394/394,
  unchanged**. `npx eslint .` (full repo) → same single pre-existing
  `CollegeDetailDrawer.jsx` item, zero new findings. `node --check` on
  every touched file. `npm run build` → succeeds, `problems-*.js` chunk
  builds clean with the modified `src/data/problems.js`.

### What Batch 1 deliberately does NOT include

- **`enabled` is still `false`.** Flipping it needs the Judge0 ID (74)
  confirmed against this deployment's real Judge0 instance first — not
  done this session (no network access to the instance from this
  sandbox).
- **No live-Mongo exercise of the `importProblems.js` change** — the
  optional-read path is new code, only verified by lint/`node --check`,
  not a real import run against a database.
- **Frontend wiring** — `GET /api/languages` already excludes disabled
  languages by construction, so no frontend change was needed or made
  this batch; the Monaco editor / language `<select>` will pick up
  TypeScript automatically once `enabled: true` is flipped, per
  `languages.js`'s own header on how that step works.
- **Two pre-existing, unrelated catalog issues noticed, not touched:**
  (1) `backend/problems/` has 257 folders on disk but only 250 problems
  exist in `src/data/problems.js`, meaning 7 orphaned folders predate
  this session and aren't part of any drift the exporter/drift-checker
  covers (they only diff what's expected to exist against what's
  present, not extra files). (2) Same reasoning applies unchanged from
  before this phase.

---

## Cross-check against the Content & Execution Architecture spec (this session)

Bunny provided the original architecture spec for the Content & Execution
Architecture work (already implemented in prior phases, per PROGRESS.md).
Audited the actual codebase against every section of it (problem model,
hidden-testcase security, language registry, enable/disable rules,
config-vs-database split, execution pipeline, API design, admin
compatibility, indexing/caching, contribution compatibility, migration
strategy) before touching anything further. Full section-by-section
findings are in the conversation log this session, not duplicated here.

Confirmed: mostly already built and correctly hardened (hidden-testcase
exclusion, fail-closed grading, config-vs-DB split, indexes matching the
actual filter fields, Redis-backed cache with explicit invalidation).

Two real gaps found and fixed this session (not part of the original
language-expansion batch, but blocking a clean "scaling" story):

### Gap 1 — no versioning existed
`Problem.contentVersion` added (minimum-viable, per the original spec's
explicit "do not over-engineer" instruction on this point) — bumped only
when a grading-contract field changes (`hiddenTestcaseSet`,
`comparisonMode`, `operationSequence`, `returnType`, `paramTypes`), via
two hooks (`pre("save")` for admin-console writes, `pre("findOneAndUpdate")`
for the seed/import upsert path — document middleware alone doesn't cover
the latter). `Submission.problemVersion` captures the value at judge time.
Deliberately NOT full immutable testcase snapshots — `Submission` already
preserves the judged *outcome*, this only adds the ability to notice a
submission was graded under a since-changed contract.

### Gap 2 — catalog problems (250/257) couldn't toggle hiddenTestcaseSet.enabled
Extended the admin catalog safelist with `hiddenTestcaseSetEnabled`,
confirmed safe by re-reading both writers of the field
(`seedProblems.js`, `importProblems.js`) — both already preserve the
existing toggle on reseed, same guarantee `enabled` itself already had.

### Verification
- Backend `npx vitest run`: **101/101 files, 1136/1136 tests** (1131 +
  5 new: 2 in `submissionController.test.js`, 3 in
  `adminProblemController.test.js`).
- New `models/Problem.contentVersion.integration.test.js` (real-Mongo
  tier, 12 cases) — covers both hooks including the idempotent-reseed
  non-bump case. **Not runnable in this sandbox** (same
  `fastdl.mongodb.org` block as every other integration test here);
  confirmed it's correctly excluded from the default `npm test` run and
  correctly picked up by `vitest.integration.config.js` (12 cases
  listed) — needs a real CI run to confirm the logic itself.
- `npx eslint` + `node --check` on every touched file: clean.
- Frontend suite (63/63, 394/394) and `npm run build`: unaffected,
  confirmed unchanged (no frontend files touched this batch).

### What this does NOT include
- No admin UI change to surface either the `contentVersion` number or a
  `hiddenTestcaseSetEnabled` toggle control for catalog problems — this
  session only built the backend capability (API-reachable via
  `PATCH /api/admin/problems/:slug`), not new frontend UI.
- No backfill/reconciliation of `contentVersion` for problems whose
  grading contract changed *before* this field existed — every existing
  problem simply starts at 1 regardless of actual edit history.
