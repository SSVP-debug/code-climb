/**
 * index.js — Code Club Edition content library
 *
 * Aggregates every mission file in this directory into one array. This is
 * a SEPARATE collection from src/data/problems.js (the standard interview
 * catalog) — different directory, different id range (90001+, vs. 1–250),
 * different identifier scheme (campaignCode "CCE-00N"), seeded by its own
 * script (backend/scripts/seedCodeClubEdition.js). Both collections are
 * still plain Problem documents that run through the exact same execution
 * engine, workspace, submissions, and progress tracking — the separation
 * is about content ownership and independent versioning, not a parallel
 * infrastructure.
 *
 * To add a new mission:
 *   1. Create CCE-00N.js in this directory, following an existing file as
 *      a template. Give it the next id (90000 + N) and campaignCode
 *      ("CCE-00N").
 *   2. Import + add it to `missions` below.
 *   3. Reference its `slug` from a chapter's `missions` array in
 *      src/data/codeClubEdition.js to place it on the campaign map.
 *   4. Run `node backend/scripts/seedCodeClubEdition.js` to push it to
 *      MongoDB.
 * No other file needs to change.
 */

import cce001 from "./CCE-001.js";
import cce002 from "./CCE-002.js";
import cce003 from "./CCE-003.js";
import cce004 from "./CCE-004.js";
import cce005 from "./CCE-005.js";
import cce006 from "./CCE-006.js";
import cce007 from "./CCE-007.js";
import cce008 from "./CCE-008.js";

const missions = [
  cce001,
  cce002,
  cce003,
  cce004,
  cce005,
  cce006,
  cce007,
  cce008,
];

export default missions;