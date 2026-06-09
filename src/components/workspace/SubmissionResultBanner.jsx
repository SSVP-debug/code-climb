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
            title: theme.words.accepted,
            message:
                theme.id === "breakingBug"
                    ? "Experiment completed successfully."
                    : "Target secured successfully.",
            classes:
                "border-green-500/30 bg-green-500/10 text-green-300",
        }
        : isWrongAnswer
            ? {
                title: theme.words.wrongAnswer,
                message:
                    theme.id === "breakingBug"
                        ? "Observed output differs from expected result."
                        : "Security systems detected an inconsistency.",
                classes:
                    "border-red-500/30 bg-red-500/10 text-red-300",
            }
            : isRuntime
                ? {
                    title: theme.words.runtimeError,
                    message:
                        "Execution stopped unexpectedly.",
                    classes:
                        "border-red-500/30 bg-red-500/10 text-red-300",
                }
                : isCompile
                    ? {
                        title: theme.words.compileError,
                        message:
                            "Your code could not be prepared for execution.",
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
        ${meta.classes}
      `}
        >
            <h3 className="font-bold text-lg">
                {meta.title}
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