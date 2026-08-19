/**
 * collegeNameHeuristics.js
 *
 * Two small, self-contained helpers used by the college auto-provisioning
 * flow (services/collegeAutoProvision.js) and by the manual college-name
 * input paths (routes/collegeVerification.js, routes/tpo.js):
 *
 *   - deriveCollegeNameFromDomain — best-effort guess at an institution's
 *     name from its email domain alone (e.g. "cse.nits.ac.in" → "NITS").
 *     This is ONLY ever used as a starting point for a `pending`/auto
 *     College record — never presented as a verified fact. An admin can
 *     always correct it via the Colleges console's rename action
 *     (collegeController.js's renameCollege). Documented as a guess at
 *     every call site that uses it.
 *
 *   - looksLikeEmailAddress — guards against the "unnecessary box" class
 *     of bug where a college's `name` field ends up literally being
 *     someone's email address (a student/TPO fat-fingering the wrong
 *     input, or pasting their email into a "college name" field). Used to
 *     reject that input server-side rather than silently storing it.
 */

// A small, deliberately curated set of "public suffix"-like tails —
// NOT a full Public Suffix List implementation, just the patterns Code
// Club actually sees among Indian engineering colleges (the product's
// target audience) plus a few common international ones. A domain suffix
// missing from this list just produces a slightly odd guess, not broken
// data — see the header comment above for why that's an acceptable
// trade-off here.
const MULTI_PART_SUFFIXES = new Set([
  "ac.in", "edu.in", "co.in", "gov.in", "res.in", "org.in", "net.in",
  "ac.uk", "co.uk", "org.uk", "gov.uk",
  "edu.au", "ac.nz", "ac.za", "ac.jp", "edu.cn", "ac.id", "edu.sg",
]);
const SINGLE_PART_SUFFIXES = new Set([
  "edu", "ac", "com", "org", "net", "in", "io", "dev", "co", "gov",
]);

function titleCaseLabel(label) {
  // Split multi-word domains on hyphens/underscores (e.g.
  // "govt-college" → "Govt College"). Short all-lowercase tokens read as
  // acronyms far more often than real words in this space (nits, srm,
  // vit, bits, iit, nit) — uppercase anything <=4 chars, title-case the
  // rest as a single capitalized word (good enough for a first-pass
  // guess; not attempting real multi-word segmentation of a squashed
  // domain label like "marwadiuniversity").
  return label
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) =>
      word.length <= 4 ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1)
    )
    .join(" ");
}

export function deriveCollegeNameFromDomain(domain) {
  if (!domain || typeof domain !== "string") return "Unnamed Institution";

  const parts = domain.toLowerCase().trim().split(".").filter(Boolean);
  if (parts.length === 0) return "Unnamed Institution";

  // Strip the public-suffix-ish tail so what's left is the registrable
  // label — e.g. "cse.nits.ac.in": suffix "ac.in" stripped →
  // ["cse", "nits"]. Whatever subdomain(s) prefix it (cse, www, mail,
  // students…) sit to the LEFT of the institution's own label, so the
  // right-most remaining token is the best guess at the institution
  // itself.
  let remaining = parts;
  if (parts.length >= 2 && MULTI_PART_SUFFIXES.has(parts.slice(-2).join("."))) {
    remaining = parts.slice(0, -2);
  } else if (parts.length >= 2 && SINGLE_PART_SUFFIXES.has(parts[parts.length - 1])) {
    remaining = parts.slice(0, -1);
  } else if (parts.length === 1) {
    remaining = [];
  }

  const label = remaining[remaining.length - 1] || parts[parts.length - 1];
  return titleCaseLabel(label);
}

const EMAIL_LIKE_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function looksLikeEmailAddress(str) {
  return typeof str === "string" && EMAIL_LIKE_RE.test(str.trim());
}
