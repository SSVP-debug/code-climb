/**
 * ContentSlot
 *
 * A transparent wrapper that marks a named region of the UI as a "slot"
 * available for future injection without consumers needing to change.
 *
 * CURRENT BEHAVIOUR
 * ─────────────────
 * Renders children as-is. No logic, no visual chrome.
 *
 * FUTURE CAPABILITIES (do not implement yet — just keep the API stable)
 * ──────────────────────────────────────────────────────────────────────
 * • Advertisement / sponsored widgets keyed by `id`
 * • A/B experiment surfaces (Optimizely, LaunchDarkly, Statsig, etc.)
 * • Feature-flag gated content (e.g. premium upsell banners)
 * • Platform announcements injected server-side by slot ID
 * • Analytics impression tracking per named region
 *
 * HOW TO EXTEND (when the time comes)
 * ─────────────────────────────────────
 * 1. Add a SlotContext or a lightweight config object in a separate
 *    SlotRegistry module — ContentSlot reads from it by `id`.
 * 2. ContentSlot renders injected content ABOVE or BELOW children
 *    based on `position` (default "above") without changing callers.
 * 3. Consumers never need to change because the `id` prop is already there.
 *
 * Props
 * ─────
 * id          string      — unique slot identifier, e.g. "profile-achievements"
 *                           Snake/kebab-case, scoped to the page: "page-section"
 * children    ReactNode   — the real content this slot wraps
 *
 * Usage
 * ─────
 * <ContentSlot id="profile-achievements">
 *   <AchievementsSection ... />
 * </ContentSlot>
 *
 * <ContentSlot id="dashboard-stats">
 *   <StatsSection ... />
 * </ContentSlot>
 */

function ContentSlot({ id, children }) {
  // `data-slot` attribute makes slots discoverable in DevTools and
  // future slot-registry queries without adding any runtime cost.
  return (
    <div data-slot={id}>
      {children}
    </div>
  );
}

export default ContentSlot;
