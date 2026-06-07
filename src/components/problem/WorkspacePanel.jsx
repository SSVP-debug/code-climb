import { useState, useEffect } from "react";
import TestcaseResultPanel from "./TestcaseResultPanel";

// ── debugPanel ────────────────────────────────────────────────────────────────

function DebugPanel({ runResults, submitInfo, isRunning, isSubmitting }) {
    // ── Loading state ─────────────────────────────────────────────────────
    if (isRunning || isSubmitting) {
        return (
            <div className="p-5 space-y-3 animate-pulse">
                <div className="h-4 w-32 rounded bg-zinc-800" />
                <div className="h-24 rounded-lg bg-zinc-800" />
            </div>
        );
    }

    // ── Collect error content to show ─────────────────────────────────────
    // Priority: compile > runtime > judge/infra > submit error > idle

    // 1. Compile error from Run
    if (runResults?.compileFailed) {
        return (
            <div className="p-5 space-y-3">
                <ErrorHeader kind="compile" />
                <ErrorBlock text={runResults.error} color="yellow" />
            </div>
        );
    }

    // 2. Runtime errors embedded in testcase results
    //    (Python/JS drivers print RUNTIME_ERROR: to stdout; we normalise in
    //     TestcaseResultPanel. Here we collect the cleaned error field.)
    // 2. Runtime errors embedded in testcase results (including RUNTIME_ERROR: in actual)
    if (runResults?.results?.length > 0) {
        const erroredCase = runResults.results.find(
            (r) =>
                r.error ||
                String(r.actual ?? "").trim().startsWith("RUNTIME_ERROR:")
        );

        console.log("DEBUG CASE FOUND:", erroredCase);

        if (erroredCase) {
            const errorText =
                erroredCase.error ||
                String(erroredCase.actual ?? "").replace(
                    /^RUNTIME_ERROR:\s*/,
                    ""
                );

            return (
                <div className="p-5 space-y-3">
                    <ErrorHeader kind="runtime" />

                    <div className="space-y-1.5">
                        <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">
                            Example {(erroredCase.index ?? 0) + 1}
                        </span>

                        <ErrorBlock text={errorText} color="red" />
                    </div>
                </div>
            );
        }
    }

    // 3. Top-level run error (network/infra — not compile, not runtime)
    if (runResults?.error && !runResults?.compileFailed) {
        return (
            <div className="p-5 space-y-3">
                <ErrorHeader kind="infra" />
                <ErrorBlock text={runResults.error} color="zinc" />
            </div>
        );
    }

    // 4. Submit-level errors
    if (submitInfo?.status) {
        const isSubmitError =
            submitInfo.status.includes("Error") ||
            submitInfo.status.includes("Compilation") ||
            submitInfo.status.includes("Runtime");

        if (isSubmitError) {
            const kind = submitInfo.status.includes("Compilation")
                ? "compile"
                : submitInfo.status.includes("Runtime")
                    ? "runtime"
                    : "judge";

            return (
                <div className="p-5 space-y-3">
                    <ErrorHeader kind={kind} label={submitInfo.status.replace(" ❌", "")} />
                    {submitInfo.error && <ErrorBlock text={submitInfo.error} color="red" />}
                    {submitInfo.passed !== undefined && (
                        <p className="text-xs text-zinc-500 font-mono">
                            {submitInfo.passed}/{submitInfo.total} testcases passed before error
                        </p>
                    )}
                </div>
            );
        }
    }

    // 5. Idle — no errors yet
    return (
        <div className="flex items-center justify-center min-h-[160px]">
            <div className="text-center space-y-2">
                <div className="text-2xl">🐛</div>
                <p className="text-zinc-600 text-sm font-mono">
                    No errors to show
                </p>
                <p className="text-zinc-700 text-xs font-mono">
                    Runtime errors and compile errors appear here
                </p>
            </div>
        </div>
    );
}

// ── debugPanel helpers ────────────────────────────────────────────────────────

const KIND_META = {
    compile: { label: "Compilation Error", color: "text-yellow-400", icon: "⚠" },
    runtime: { label: "Runtime Error", color: "text-red-400", icon: "✗" },
    judge: { label: "Judge Error", color: "text-zinc-400", icon: "⚙" },
    infra: { label: "Runner Unavailable", color: "text-zinc-400", icon: "⚙" },
};

function ErrorHeader({ kind, label }) {
    const meta = KIND_META[kind] ?? KIND_META.judge;
    return (
        <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold font-mono ${meta.color}`}>
                {meta.icon} {label ?? meta.label}
            </span>
        </div>
    );
}

const COLOR_CLASSES = {
    yellow: "border-yellow-500/25 text-yellow-200",
    red: "border-red-500/25    text-red-300",
    zinc: "border-zinc-700      text-zinc-400",
};

function ErrorBlock({ text, color = "red" }) {
    if (!text) return null;
    return (
        <div
            className={`
        bg-zinc-950 border rounded-lg px-3 py-2.5
        font-mono text-xs whitespace-pre-wrap break-all
        max-h-56 overflow-y-auto
        ${COLOR_CLASSES[color] ?? COLOR_CLASSES.red}
      `}
        >
            {text}
        </div>
    );
}

// ── WorkspacePanel ────────────────────────────────────────────────────────────

const TABS = ["testcases", "debug"];

export default function WorkspacePanel({
    runResults,
    submitInfo,
    isRunning,
    isSubmitting,
    forceTab,
}) {
    const [activeTab, setActiveTab] = useState("testcases");

    // Respect forceTab whenever it changes (new run/submit result arrived)
    useEffect(() => {
        console.log("WORKSPACE RECEIVED:", forceTab);

        if (forceTab === "testcases" || forceTab === "debug") {
            console.log("SWITCHING TO:", forceTab);
            setActiveTab(forceTab);
        }
    }, [forceTab]);

    // ── Tab counts / badges ───────────────────────────────────────────────
    const errorCount = (() => {
        if (runResults?.compileFailed) return 1;
        if (runResults?.results) {
            return runResults.results.filter((r) => r.error).length;
        }
        if (submitInfo?.status?.includes("Error") ||
            submitInfo?.status?.includes("Compilation") ||
            submitInfo?.status?.includes("Runtime")) return 1;
        return 0;
    })();

    const passCount = runResults?.results?.filter((r) => r.passed && !r.error).length ?? 0;
    const totalCount = runResults?.results?.length ?? 0;

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">

            {/* ── Tab bar ──────────────────────────────────────────────────── */}
            <div className="flex items-center border-b border-zinc-800 px-1 pt-1">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab;

                    // Badge for testcases tab: "2/3" when results exist
                    const badge =
                        tab === "testcases" && totalCount > 0
                            ? `${passCount}/${totalCount}`
                            : tab === "debug" && errorCount > 0
                                ? String(errorCount)
                                : null;

                    // Badge colour
                    const badgeColor =
                        tab === "testcases"
                            ? passCount === totalCount && totalCount > 0
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            : "bg-red-500/20 text-red-400";

                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`
                relative px-4 py-2.5 text-xs font-mono font-medium
                flex items-center gap-2
                transition-colors duration-150
                ${isActive
                                    ? "text-white"
                                    : "text-zinc-500 hover:text-zinc-300"
                                }
              `}
                        >
                            {tab === "testcases" ? "testcases" : "debug"}

                            {badge && (
                                <span
                                    className={`
                    px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold
                    ${badgeColor}
                  `}
                                >
                                    {badge}
                                </span>
                            )}

                            {/* Active underline */}
                            {isActive && (
                                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-t-full" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Tab content ──────────────────────────────────────────────── */}
            <div className="min-h-[220px]">
                {activeTab === "testcases" ? (
                    <div className="p-4">
                        <TestcaseResultPanel
                            results={runResults?.results ?? null}
                            compileFailed={runResults?.compileFailed ?? false}
                            compileError={runResults?.error ?? null}
                            isRunning={isRunning}
                        />
                    </div>
                ) : (
                    <DebugPanel
                        runResults={runResults}
                        submitInfo={submitInfo}
                        isRunning={isRunning}
                        isSubmitting={isSubmitting}
                    />
                )}
            </div>
        </div>
    );
}
