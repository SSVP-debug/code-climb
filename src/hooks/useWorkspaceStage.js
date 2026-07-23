import { useEffect, useReducer } from "react";

/**
 * useWorkspaceStage — the Understand → Build → Validate progression.
 *
 * This is the ONLY place stage-transition logic lives. Components consume
 * `stage` and call `enterBuild()`; nothing else should reach in and set
 * stage directly, so if the rules ever need to change (e.g. adding a way
 * to go back, or a fourth stage) there's exactly one function to edit.
 *
 * Rules, deliberately simple:
 *   - A problem the student has already solved skips the reading overlay —
 *     they've seen it before; re-reading it every revisit is friction, not
 *     focus. Everyone else starts at "understand".
 *   - "understand" → "build": the only way out is enterBuild(), fired by
 *     either the "Start Coding" button or clicking the blurred backdrop —
 *     both mean the same thing (leaving Stage 1 always means arriving at
 *     Stage 2, there's no third "closed but not building" state).
 *   - "build" → "validate": automatic, the instant the student has a Run
 *     or Submit result. Once earned, validate is sticky — re-running
 *     doesn't hide the panel again, there's no requirement that it should.
 */
function reducer(stage, action) {
  switch (action.type) {
    case "ENTER_BUILD":
      return stage === "understand" ? "build" : stage;
    case "ENTER_VALIDATE":
      return stage === "build" ? "validate" : stage;
    default:
      return stage;
  }
}

export function useWorkspaceStage({ isSolved, hasResults }) {
  const [stage, dispatch] = useReducer(reducer, isSolved ? "build" : "understand");

  useEffect(() => {
    if (hasResults) dispatch({ type: "ENTER_VALIDATE" });
  }, [hasResults]);

  const enterBuild = () => dispatch({ type: "ENTER_BUILD" });

  return { stage, enterBuild };
}