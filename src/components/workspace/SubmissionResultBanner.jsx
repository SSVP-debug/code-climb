import { useTheme } from "../../context/ThemeContext";

export default function SubmissionResultBanner({
    submitInfo,
}) {
    const { theme } = useTheme();

    if (!submitInfo?.status) {
        return null;
    }

    const isAccepted =
        submitInfo.status.includes("Accepted");

    const isWrongAnswer =
        submitInfo.status.includes("Wrong Answer");

    const isRuntime =
        submitInfo.status.includes("Runtime");

    const isCompile =
        submitInfo.status.includes("Compilation");

    const isError =
        submitInfo.status.includes("Error");

    const meta = isAccepted
        ? {
            icon: theme.id === "breakingBug" ? "🧪" : "💰",
            title: theme.words.accepted,
            message:
                theme.id === "breakingBug"
                    ? "Batch purity confirmed."
                    : "The Professor approves. Target secured.",
            classes:
                "border-green-500/30 bg-green-500/10 text-green-300",
        }
        : isWrongAnswer
            ? {
                icon: theme.id === "breakingBug" ? "⚗️" : "🚨",
                title: theme.words.wrongAnswer,
                message:
                    theme.id === "breakingBug"
                        ? "Impurities detected in the batch."
                        : "The alarm system detected a flaw in the plan.",
                classes:
                    "border-red-500/30 bg-red-500/10 text-red-300",
            }
            : isRuntime
                ? {
                    icon: theme.id === "breakingBug" ? "💥" : "🏃",
                    title: theme.words.runtimeError,
                    message:
                        theme.id === "breakingBug"
                            ? "The cook exploded unexpectedly."
                            : "The escape route failed.",
                    classes:
                        "border-red-500/30 bg-red-500/10 text-red-300",
                }
                : isCompile
                    ? {
                        icon: theme.id === "breakingBug" ? "📖" : "📋",
                        title: theme.words.compileError,
                        message:
                            theme.id === "breakingBug"
                                ? "The recipe is incomplete."
                                : "The Professor rejected the plan.",
                        classes:
                            "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
                    }
                    : {
                        title: theme.words.judgeError,
                        message:
                            "The evaluation system encountered an issue.",
                        classes:
                            "border-zinc-700 bg-zinc-800 text-zinc-300",
                    };

    return (
        <div
            className={`
    mb-4 rounded-2xl border p-4
    animate-[fadeIn_.25s_ease-out]
    ${isAccepted
                    ? "animate-[pulseGlow_1s_ease-out]"
                    : ""
                }
    ${meta.classes}
`}
        >
            <h3 className="font-bold text-lg flex items-center gap-2">
                <span>{meta.icon}</span>
                <span>{meta.title}</span>
            </h3>

            <p className="text-sm mt-1 opacity-90">
                {meta.message}
            </p>

            {submitInfo.passed !== undefined &&
                submitInfo.total !== undefined && (
                    <p className="text-xs mt-2 opacity-70">
                        {submitInfo.passed}/{submitInfo.total} testcases passed
                    </p>
                )}
        </div>
    );
}