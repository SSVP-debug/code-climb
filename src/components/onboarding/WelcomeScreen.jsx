import { Sparkles } from "lucide-react";
import Button from "../ui/Button";
import { useTheme } from "../../context/ThemeContext";

/**
 * WelcomeScreen — step 1 of the first-session onboarding flow
 * (docs/002-first-session-onboarding-flow.md). Not a splash screen: this is
 * framed as "the beginning of today's coding session", appreciating the
 * user for showing up rather than a generic motivational quote. CTA is
 * intentionally "Start Today's Session" — the spec explicitly bans
 * "Skip"/"Continue"/"Next" anywhere in this flow.
 */
export default function WelcomeScreen({ onStart }) {
  const { theme } = useTheme();
  const primary = theme?.colors?.primary ?? "#2dd4bf";

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-xl text-center animate-[fadeIn_.4s_ease-out]">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8"
          style={{ backgroundColor: `${primary}1f`, color: primary }}
        >
          <Sparkles size={30} strokeWidth={2} aria-hidden="true" />
        </div>

        <h1 className="text-4xl font-bold mb-4 text-white">
          Good to see you today.
        </h1>

        <p className="text-zinc-400 text-lg mb-10">
          Every session you show up for adds to who you're becoming as a
          problem solver. This one's already started.
        </p>

        <Button
          variant="primary"
          size="lg"
          onClick={onStart}
          className="focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          Start Today's Session
        </Button>
      </div>
    </div>
  );
}