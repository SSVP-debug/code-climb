/**
 * config/site.js — single source of truth for the deployed site URL and
 * support contact, frontend side.
 *
 * Before this file, the real domain (code-club-one.vercel.app) and two
 * placeholder domains that don't exist (code-club.com, codeclub.in) were
 * scattered across several pages. Changing to a real custom domain, or
 * setting up a real support inbox, should now be a one-line edit here
 * rather than a find-and-replace across pages.
 */

export const SITE_URL = "https://code-club-one.vercel.app"; // update when a custom domain is set

// TODO: not a real inbox yet — update once one exists.
export const SUPPORT_EMAIL = "hello@codeclub.in";

// Domain only, no protocol — for display copy like "share your profile at ___".
export const SITE_DOMAIN = SITE_URL.replace(/^https?:\/\//, "");
