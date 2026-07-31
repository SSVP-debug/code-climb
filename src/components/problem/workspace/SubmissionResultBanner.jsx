import { useState, useEffect } from "react";
import TestcaseResultPanel from "./TestcaseResultPanel";
import { useTheme } from "../../context/ThemeContext";
import { FileWarning, Bomb, Settings, Bug } from "lucide-react";

// ── DebugPanel ────────────────────────────────────────────────────────────────

function DebugPanel({
    runResults,
    submitInfo,
    isRunning,
    isSubmitting,
    theme
}) {
    if (isRunning || isSubmitting) {
        return (
            <div className="p-5 space-y-3 animate-pulse">
                <div className="h-4 w-32 rounded bg-ink-950" />
                <div className="h-24 rounded-lg bg-ink-950" />
            </div>
        );
    }

    if (runResults?.compileFailed) {
        return (
            <div className="p-5 space-y-3">
                <ErrorHeader
                    kind="compile"
                    theme={theme}
                />
                <ErrorBlock text={runResults.error} color="pending" />
            </div>
        );
    }

    if (runResults?.results?.length > 0) {
        const erroredCase = runResults.results.find(
            (r) =>
                r.error ||
                String(r.actual ?? "").trim().startsWith("RUNTIME_ERROR:")
        );
        if (erroredCase) {
            return (
                <div className="p-5 space-y-3">
                    <ErrorHeader kind="runtime" theme={theme} />
                    <div className="space-y-1.5">
                        <span className="text-[11px] font-mono-ui uppercase tracking-widest text-zinc-500">
                            Example {erroredCase.index + 1}
                        </span>
                        <ErrorBlock text={erroredCase.error} color="reject" />
                    </div>
                    {runResults.results.filter((r) => r.error).length > 1 && (
                        <p className="text-xs text-zinc-500 font-mono-ui">
                            + {runResults.results.filter((r) => r.error).length - 1} more
                            runtime error{runResults.results.filter((r) => r.error).length > 2 ? "s" : ""}
                        </p>
                    )}
                </div>
            );
        }
    }

    if (runResults?.error && !runResults?.compileFailed) {
        return (
            <div className="p-5 space-y-3">
                <ErrorHeader kind="infra" theme={theme} />
                <ErrorBlock text={runResults.error} color="neutral" />
            </div>
        );
    }

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
                    <ErrorHeader kind={kind} label={submitInfo.status} theme={theme} />
                    {submitInfo.error && <ErrorBlock text={submitInfo.error} color="reject" />}
                    {submitInfo.passed !== undefined && (
                        <p className="text-xs text-zinc-500 font-mono-ui">
                            {submitInfo.passed}/{submitInfo.total} testcases passed before error
                        </p>
                    )}
                </div>
            );
        }
    }

    return (
        <div className="flex items-center justify-center h-full min-h-[160px]">
            <div className="text-center space-y-2">
                <Bug className="mx-auto text-zinc-700" size={26} strokeWidth={1.75} aria-hidden="true" />
                <p className="text-zinc-600 text-sm font-mono-ui">No errors to show</p>
                <p className="text-zinc-700 text-xs font-mono-ui">
                    Runtime errors and compile errors appear here
                </p>
            </div>
        </div>
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getKindMeta(theme) {
    return {
        compile: {
            label: theme.words.compileError,
            color: "text-verdict-pending",
            Icon: FileWarning,
        },

        runtime: {
            label: theme.words.runtimeError,
            color: "text-verdict-reject",
            Icon: Bomb,
        },

        judge: {
            label: theme.words.judgeError,
            color: "text-zinc-400",
            Icon: Settings,
        },

        infra: {
            label: "Runner Unavailable",
            color: "text-zinc-400",
            Icon: Settings,
        },
    };
}

function ErrorHeader({ kind, label, theme }) {
    const KIND_META = getKindMeta(theme);
    const meta = KIND_META[kind] ?? KIND_META.judge;
    return (
        <div className="flex items-center gap-2">
            <meta.Icon size={16} strokeWidth={2} className={meta.color} aria-hidden="true" />
            <span className={`text-sm font-semibold font-mono-ui ${meta.color}`}>
                {label ?? meta.label}
            </span>
        </div>
    );
}

const COLOR_CLASSES = {
    pending: "border-verdict-pending/25 text-verdict-pending",
    reject: "border-verdict-reject/25  text-verdict-reject",
    neutral: "border-ink-700           text-zinc-400",
};

function ErrorBlock({ text, color = "reject" }) {
    if (!text) return null;
    return (
        <div
            className={`
        bg-ink-950 border rounded-lg px-3 py-2.5
        font-mono-ui text-xs whitespace-pre-wrap break-all
        max-h-56 overflow-y-auto
        ${COLOR_CLASSES[color] ?? COLOR_CLASSES.reject}
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
    problem,
}) {
    const [activeTab, setActiveTab] = useState("testcases");
    const { theme } = useTheme();



    const errorCount = (() => {
        if (runResults?.compileFailed) return 1;
        if (runResults?.results) return runResults.results.filter((r) => r.error).length;
        if (
            submitInfo?.status?.includes("Error") ||
            submitInfo?.status?.includes("Compilation") ||
            submitInfo?.status?.includes("Runtime")
        ) return 1;
        return 0;
    })();

    const passCount = runResults?.results?.filter((r) => r.passed && !r.error).length ?? 0;
    const totalCount = runResults?.results?.length ?? 0;

    return (
        /* h-full fills the flex-1 wrapper. flex flex-col: tab bar fixed, content flex-1. */
        <div className="
h-full
flex
flex-col
overflow-hidden
">

            {/* ── Tab bar — flex-shrink-0, always visible ───────────────────── */}
            <div
                className="flex items-center border-b border-ink-700 px-1 pt-1 flex-shrink-0"
            >

                {TABS.map((tab) => {
                    const isActive = activeTab === tab;

                    const badge =
                        tab === "testcases" && totalCount > 0
                            ? `${passCount}/${totalCount}`
                            : tab === "debug" && errorCount > 0
                                ? String(errorCount)
                                : null;

                    const badgeColor =
                        tab === "testcases"
                            ? passCount === totalCount && totalCount > 0
                                ? "bg-verdict-accept/20 text-verdict-accept"
                                : "bg-verdict-reject/20 text-verdict-reject"
                            : "bg-verdict-reject/20 text-verdict-reject";

                    return (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                            }}
                            className={`
                relative px-5 py-3 text-sm font-mono-ui font-medium
                flex items-center gap-2 transition-colors duration-150
                ${isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"}
              `}
                        >
                            {tab === "testcases"
                                ? theme.words.testcases
                                : theme.words.debug}

                            {badge && (
                                <span className={`px-2 py-0.5 rounded text-xs font-mono-ui font-semibold ${badgeColor}`}>
                                    {badge}
                                </span>
                            )}

                            {isActive && (
                                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-t-full" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/*
        ── Tab content ───────────────────────────────────────────────────────
        flex-1:             takes all remaining height inside the flex-col panel.
        min-h-0:            CSS flex fix — without this, flex children won't
                            shrink below their content size, defeating overflow-y-auto.
        overflow-y-auto:    THIS is the scroll owner for workspace content.
                            Long testcase lists or error output scroll here only.
        custom-scrollbar:   project's existing thin scrollbar style.
      */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                {activeTab === "testcases" ? (
                    <div className="p-4">
                        <TestcaseResultPanel
                            results={runResults?.results ?? null}
                            compileFailed={runResults?.compileFailed ?? false}
                            compileError={runResults?.error ?? null}
                            isRunning={isRunning}
                            examples={problem?.examples ?? []}
                        />
                    </div>
                ) : (
                    <DebugPanel
                        runResults={runResults}
                        submitInfo={submitInfo}
                        isRunning={isRunning}
                        isSubmitting={isSubmitting}
                        theme={theme}
                    />
                )}
            </div>

        </div>
    );
}