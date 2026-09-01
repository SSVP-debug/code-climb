/**
 * ThemeFlowProgress — minimal step indicator for the post-login theme flow
 * (Choose Universe → Confirm). Shared by ThemeSelectionPage and
 * ThemeConfirmationPage so the user always knows where they are and how
 * many steps are left before landing on the dashboard.
 */
const STEPS = ["Choose Universe", "Confirm"];

export default function ThemeFlowProgress({ step }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${step} of ${STEPS.length}`}>
      {STEPS.map((label, i) => {
        const num = i + 1;
        const active = num === step;
        const complete = num < step;

        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold border transition-colors ${
                active
                  ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                  : complete
                  ? "bg-[var(--border-strong)] text-[var(--foreground)] border-[var(--border-strong)]"
                  : "border-[var(--border-strong)] text-[var(--muted-foreground)]"
              }`}
            >
              {num}
            </span>
            <span
              className={`text-xs font-medium transition-colors ${
                active ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span aria-hidden="true" className="w-6 h-px bg-[var(--border-strong)] mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}