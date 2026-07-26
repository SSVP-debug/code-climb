import { useMediaQuery } from "./useMediaQuery";

/**
 * True when the user has requested reduced motion at the OS/browser level.
 * Used to swap the sticky, spring-driven letter-journey experience for a
 * simple static version instead of just muting individual transforms —
 * a scroll-pinned section is itself a motion pattern some users want to
 * avoid entirely, not just the letter flights within it.
 */
export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}