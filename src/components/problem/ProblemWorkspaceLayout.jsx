/**
 * ProblemWorkspaceLayout — replaces ProblemSolverDesktopView +
 * ProblemSolverMobileView with a single component tree.
 *
 * ── Why this file exists (Batch 1 of the workspace redesign) ──────────────
 * The previous two-component split rendered BOTH the desktop split-view and
 * the mobile tabbed-view at all times, toggling visibility with Tailwind's
 * `hidden lg:flex` / `flex lg:hidden` classes. That's CSS-only visibility —
 * React still mounted both trees, so:
 *
 *   1. A <ProblemEditor> (and therefore a full Monaco instance) existed on
 *      EVERY device regardless of viewport — on an actual phone, the
 *      desktop split-view's editor was mounted invisibly (display:none),
 *      paying full Monaco init cost for nothing.
 *   2. On mobile, the tabbed view additionally *conditionally rendered*
 *      its own editor only `{mobileTab === "code" && <ProblemEditor/>}`
 *      — so switching away from the Code tab and back unmounted and
 *      remounted Monaco, silently losing cursor position and undo history.
 *
 * This file fixes both: there is exactly ONE <ProblemEditor> and ONE
 * <WorkspacePanel> in the tree, always mounted, at a fixed position in the
 * component hierarchy. Desktop vs. mobile, and mobile's active tab, are
 * expressed ONLY as className/style changes on their wrapper elements
 * (including CSS `display: contents` where a wrapper needs to disappear
 * layout-wise without disappearing from the DOM). Swapping a prop on an
 * element never remounts it — only changing an element's *position* in the
 * tree does — so this guarantees Monaco survives every tab switch and every
 * viewport resize/rotation.
 *
 * `useMediaQuery` (not a static Tailwind breakpoint) drives `isDesktop`
 * because a few desktop-only values (problemWidth/editorHeight, in pixels
 * and percent, from the resize-drag hooks) need to be applied or withheld
 * in JS, not just CSS.
 */
import ErrorBanner from "../ErrorBanner";
import ErrorBoundary from "../ErrorBoundary";
import SubmissionResultBanner from "../workspace/SubmissionResultBanner";
import ProblemHeader from "./ProblemHeader";
import ProblemInfo from "./ProblemInfo";
import ProblemEditor from "./ProblemEditor";
import WorkspacePanel from "./WorkspacePanel";
import Button from "../ui/Button";
import MobileTabBar from "./MobileTabBar";
import { useMediaQuery } from "../../hooks/useMediaQuery";

// Tailwind's default `lg` breakpoint — kept as one constant so the JS
// breakpoint and the (few) remaining Tailwind `lg:` classes below can never
// silently drift apart.
const DESKTOP_QUERY = "(min-width: 1024px)";

function ProblemWorkspaceLayout({ problem, slug, solver }) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);

  const {
    isSolved,
    timerFormatted,
    editorHeight,
    setEditorHeight,
    problemWidth,
    setProblemWidth,
    language,
    code,
    setCode,
    customInput,
    setCustomInput,
    running,
    submitting,
    error,
    runResults,
    submitInfo,
    mobileTab,
    setMobileTab,
    forceTab,
    hasResults,
    handleLanguageChange,
    handleResetCode,
    handleRunCode,
    handleSubmitCode,
  } = solver;

  // The single visibility rule for all three panels. Desktop always shows
  // all three (split view); mobile shows exactly the one matching the
  // active tab. This is the ONLY thing that changes between breakpoints —
  // every panel below stays mounted at the same tree position regardless.
  const panelVisible = {
    info: isDesktop || mobileTab === "problem",
    editor: isDesktop || mobileTab === "code",
    workspace: isDesktop || mobileTab === "results",
  };

  return (
    <div
      className={
        isDesktop
          ? "h-full flex overflow-hidden bg-zinc-950 px-3 py-2 gap-3"
          : "flex flex-col h-full overflow-hidden"
      }
    >
      {!isDesktop && (
        <MobileTabBar active={mobileTab} onChange={setMobileTab} hasResults={hasResults} />
      )}

      <div
        className={
          isDesktop
            ? "flex h-full w-full overflow-hidden relative gap-3"
            : "flex-1 min-h-0 overflow-y-auto bg-zinc-950"
        }
      >
        {/* ── Info panel (Problem tab on mobile) ─────────────────────────── */}
        <div
          className={
            isDesktop
              ? "h-full overflow-hidden"
              : panelVisible.info
                ? "p-4 bg-zinc-900 min-h-full"
                : "hidden"
          }
          style={isDesktop ? { width: `${problemWidth}%` } : undefined}
        >
          <div
            className={
              isDesktop
                ? "h-full overflow-y-auto custom-scrollbar bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl"
                : undefined
            }
          >
            {!isDesktop && !isSolved && (
              <div className="mb-4">
                <span className="text-xs font-mono text-zinc-500">⏱ {timerFormatted}</span>
              </div>
            )}
            <ProblemHeader problem={problem} isSolved={isSolved} />
            <ProblemInfo problem={problem} />
            {!isDesktop && (
              <Button onClick={() => setMobileTab("code")} className="mt-6 w-full">
                Start Coding →
              </Button>
            )}
          </div>
        </div>

        {/* Resize handle (horizontal — problem/editor split). Stateless UI,
            safe to actually unmount when not on desktop. */}
        {isDesktop && (
          <div
            className="w-1 mx-2 cursor-col-resize bg-zinc-800/40 rounded-full hover:bg-[var(--theme-primary,#2dd4bf)] transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = problemWidth;
              const handleMove = (moveEvent) => {
                const delta = ((moveEvent.clientX - startX) / window.innerWidth) * 100;
                setProblemWidth(Math.min(45, Math.max(20, startWidth + delta)));
              };
              const handleUp = () => {
                window.removeEventListener("mousemove", handleMove);
                window.removeEventListener("mouseup", handleUp);
              };
              window.addEventListener("mousemove", handleMove);
              window.addEventListener("mouseup", handleUp);
            }}
          />
        )}

        {/* ── Editor + Workspace column ───────────────────────────────────
            `display: contents` on mobile removes this wrapper from layout
            (children stack directly in the scroll container above) without
            removing it — or them — from the DOM/React tree. */}
        <div
          className={isDesktop ? "h-full flex flex-col overflow-hidden" : "contents"}
          style={isDesktop ? { width: `${100 - problemWidth}%` } : undefined}
        >
          {error && (
            <div
              className={
                isDesktop
                  ? "flex-shrink-0 pb-2"
                  : panelVisible.editor
                    ? "px-4 pt-3 flex-shrink-0"
                    : "hidden"
              }
            >
              <ErrorBanner message={error} />
            </div>
          )}

          {/* Editor — always mounted, never remounted, regardless of
              breakpoint or active mobile tab. This is the fix. */}
          <div
            className={
              isDesktop
                ? "flex-shrink-0 pb-2"
                : panelVisible.editor
                  ? "flex flex-col h-full min-h-[calc(100vh-108px)]"
                  : "hidden"
            }
            style={isDesktop ? { height: `${editorHeight}px` } : undefined}
          >
            <ErrorBoundary
              fallback={
                <div className="h-full bg-zinc-900 border border-red-500 text-red-400 p-6 rounded-2xl">
                  Editor failed to load.
                </div>
              }
            >
              <ProblemEditor
                slug={slug}
                language={language}
                setLanguage={handleLanguageChange}
                code={code}
                setCode={setCode}
                customInput={customInput}
                setCustomInput={setCustomInput}
                onRun={handleRunCode}
                onSubmit={handleSubmitCode}
                onReset={handleResetCode}
                running={running}
                submitting={submitting}
              />
            </ErrorBoundary>
          </div>

          {/* Resize handle (vertical — editor/results split). Stateless UI,
              safe to actually unmount when not on desktop. */}
          {isDesktop && (
            <div
              className="w-full h-2 cursor-row-resize rounded-full bg-zinc-800/40 hover:bg-[var(--theme-primary,#2dd4bf)] transition-colors mb-2"
              onMouseDown={(e) => {
                e.preventDefault();
                const startY = e.clientY;
                const startHeight = editorHeight;
                const handleMove = (moveEvent) => {
                  const delta = moveEvent.clientY - startY;
                  setEditorHeight(Math.min(600, Math.max(200, startHeight + delta)));
                };
                const handleUp = () => {
                  window.removeEventListener("mousemove", handleMove);
                  window.removeEventListener("mouseup", handleUp);
                };
                window.addEventListener("mousemove", handleMove);
                window.addEventListener("mouseup", handleUp);
              }}
            />
          )}

          {/* Workspace/results — always mounted, never remounted. */}
          <div
            className={
              isDesktop
                ? "flex-1 min-h-0 flex flex-col"
                : panelVisible.workspace
                  ? "p-4"
                  : "hidden"
            }
          >
            <SubmissionResultBanner submitInfo={submitInfo} />
            <div
              className={
                isDesktop
                  ? "flex-1 min-h-0 overflow-hidden bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl"
                  : undefined
              }
            >
              <WorkspacePanel
                runResults={runResults}
                submitInfo={submitInfo}
                isRunning={running}
                isSubmitting={submitting}
                forceTab={forceTab}
                problem={problem}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProblemWorkspaceLayout;