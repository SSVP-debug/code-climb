import Button from "../ui/Button";
import Reveal from "./Reveal";

function CtaSection({ user }) {
  return (
    <section className="border-t border-ink-700 bg-ink-900/60 backdrop-blur-sm">
      <Reveal as="div" className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          Your placement prep starts today.
        </h2>
        <p className="text-zinc-400 mb-8">
          Join students building consistency, not just solving problems once and forgetting.
        </p>
        <Button
          to={user ? "/dashboard" : "/portal"}
          variant="theme"
          size="xl"
          className="shadow-xl shadow-verdict-accept/10"
        >
          {user ? "Go to Dashboard →" : "Start Free — No Card Needed →"}
        </Button>
        <p className="text-xs text-zinc-600 mt-4 font-mono-ui">
          Google sign-in · Ready in 10 seconds
        </p>
      </Reveal>
    </section>
  );
}

export default CtaSection;