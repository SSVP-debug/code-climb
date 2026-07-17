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
                  ? "bg-white text-black border-white"
                  : complete
                  ? "bg-zinc-600 text-white border-zinc-600"
                  : "border-zinc-700 text-zinc-500"
              }`}
            >
              {num}
            </span>
            <span
              className={`text-xs font-medium transition-colors ${
                active ? "text-white" : "text-zinc-500"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span aria-hidden="true" className="w-6 h-px bg-zinc-700 mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}