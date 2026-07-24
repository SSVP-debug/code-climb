import { useAppContext } from "./useAppContext";

/**
 * Settings → Editor → "Disable difficulty labels". Every place in the app
 * that renders an Easy/Medium/Hard badge on an individual problem checks
 * this instead of reading `preferences.hideDifficultyLabels` directly —
 * one hook, so if the rule for when labels hide ever needs to change
 * (e.g. per-route, per-role), there's exactly one place to do it instead
 * of a dozen call sites to hunt down.
 *
 * Scope, deliberately: this hides the badge on an individual problem
 * (cards, list rows, related/pinned problems, the problem header, live
 * interview mode) — anywhere seeing the difficulty before/while attempting
 * a problem could bias how a student approaches it, which is the whole
 * point of the setting. It does NOT hide difficulty words used as the
 * axis of an aggregate statistic (a profile's "12 Easy / 8 Medium solved"
 * breakdown, leaderboard per-user solve counts, TPO dashboards) — those
 * are informational after the fact, not a label to bias against, and
 * hiding the word there would just make the number meaningless.
 */
export function useHideDifficultyLabels() {
  const { preferences } = useAppContext();
  return preferences.hideDifficultyLabels;
}