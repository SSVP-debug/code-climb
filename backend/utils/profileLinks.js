/**
 * profileLinks.js
 *
 * Server-side validation/normalization for the developer-profile links
 * (GitHub, LinkedIn, resume, featured-project repo). Frontend validates
 * for instant feedback, but this is the source of truth — see
 * userController.js updateMe, the only writer of these fields.
 *
 * Every function returns { ok: true, value } or { ok: false, error }.
 * `value` for the URL functions is a normalized https:// URL or null
 * (null clears the field). Only http/https protocols are ever accepted,
 * so `javascript:` and friends are rejected before they can reach the DB.
 */

const ALLOWED_PROTOCOLS = ["http:", "https:"];

function tryParseUrl(candidate) {
  try {
    return new URL(candidate);
  } catch {
    return null;
  }
}

// Accepts a bare handle ("octocat"), a domain-only string
// ("github.com/octocat"), or a full URL, and coerces it to something
// `new URL()` can parse against `defaultHost`.
function coerceToUrl(input, defaultHost) {
  const trimmed = (input || "").trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.includes(".") || trimmed.includes("/")) return `https://${trimmed}`;
  return `https://${defaultHost}/${trimmed.replace(/^@/, "")}`;
}

export function normalizeGithubProfileUrl(input) {
  const trimmed = (input || "").trim();
  if (!trimmed) return { ok: true, value: null };

  const url = tryParseUrl(coerceToUrl(trimmed, "github.com"));
  if (!url || !ALLOWED_PROTOCOLS.includes(url.protocol)) {
    return { ok: false, error: "Enter a valid GitHub profile URL." };
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "github.com") {
    return { ok: false, error: "That doesn't look like a github.com URL." };
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length !== 1) {
    return { ok: false, error: "Enter your GitHub profile URL, e.g. github.com/yourname." };
  }

  const username = segments[0];
  if (!/^[a-zA-Z0-9-]{1,39}$/.test(username)) {
    return { ok: false, error: "That GitHub username doesn't look valid." };
  }

  return { ok: true, value: `https://github.com/${username}` };
}

export function normalizeLinkedinUrl(input) {
  const trimmed = (input || "").trim();
  if (!trimmed) return { ok: true, value: null };

  const url = tryParseUrl(coerceToUrl(trimmed, "linkedin.com/in"));
  if (!url || !ALLOWED_PROTOCOLS.includes(url.protocol)) {
    return { ok: false, error: "Enter a valid LinkedIn URL." };
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (!host.endsWith("linkedin.com")) {
    return { ok: false, error: "That doesn't look like a linkedin.com URL." };
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2 || segments[0] !== "in") {
    return { ok: false, error: "Enter your LinkedIn profile URL, e.g. linkedin.com/in/yourname." };
  }

  return { ok: true, value: `https://www.linkedin.com/in/${segments[1]}` };
}

// Generic https(s) URL check — used for the resume link, which isn't
// tied to one domain (Drive, Dropbox, a personal site, etc.).
export function normalizeGenericUrl(input, { label = "URL" } = {}) {
  const trimmed = (input || "").trim();
  if (!trimmed) return { ok: true, value: null };

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = tryParseUrl(candidate);
  if (!url || !ALLOWED_PROTOCOLS.includes(url.protocol) || !url.hostname.includes(".")) {
    return { ok: false, error: `Enter a valid ${label}.` };
  }

  return { ok: true, value: url.toString() };
}

// Parses a GitHub repo URL into { url, owner, repo }. Deliberately does
// NOT fetch anything — no stars/forks/description/language, per the
// no-fake-metadata constraint. Just safe, derived identity.
export function parseGithubRepoUrl(input) {
  const trimmed = (input || "").trim();
  if (!trimmed) return { ok: true, value: null };

  const url = tryParseUrl(coerceToUrl(trimmed, "github.com"));
  if (!url || !ALLOWED_PROTOCOLS.includes(url.protocol)) {
    return { ok: false, error: "Enter a valid GitHub repository URL." };
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "github.com") {
    return { ok: false, error: "Enter a github.com repository URL." };
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2) {
    return { ok: false, error: "Enter a full repository URL, e.g. github.com/owner/repo." };
  }

  const [owner, repoRaw] = segments;
  const repo = repoRaw.replace(/\.git$/i, "");

  if (!/^[a-zA-Z0-9-]{1,39}$/.test(owner) || !/^[\w.-]{1,100}$/.test(repo)) {
    return { ok: false, error: "That repository URL doesn't look valid." };
  }

  return { ok: true, value: { url: `https://github.com/${owner}/${repo}`, owner, repo } };
}
