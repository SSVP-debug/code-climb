import { CheckCircle2, ShieldCheck, Eye } from "lucide-react";
import Reveal from "./Reveal";

// Not a "them vs. us" table — a real, ordered pipeline. The numbering here
// is earned: this is the literal sequence a solve goes through, and each
// stage's accent matches the same role color used for it in AudienceGrid
// (teal = student, violet = TPO, sky = recruiter), so the same three
// colors mean the same three roles everywhere on the page.
const STAGES = [
  {
    id: "solve",
    Icon: CheckCircle2,
    eyebrow: "01 · Student",
    title: "Solve",
    body: "Submissions run against hidden test cases on our Judge0 sandbox. The verdict is set by the server, never by the client — there's no local \"mark as done.\"",
    accent: "teal",
  },
  {
    id: "verify",
    Icon: ShieldCheck,
    eyebrow: "02 · TPO",
    title: "Verify",
    body: "Every accepted solve rolls into your batch's readiness dashboard automatically streaks and topic coverage a TPO can trust without a spreadsheet.",
    accent: "violet",
  },
  {
    id: "discover",
    Icon: Eye,
    eyebrow: "03 · Recruiter",
    title: "Get discovered",
    body: "Recruiters search by verified solve history and topic strength, and send a skills test directly no resume claims to take on faith.",
    accent: "sky",
  },
];

const ACCENT = {
  teal: {
    icon: "text-teal-400 bg-teal-500/10 border-teal-500/25",
  },
  violet: {
    icon: "text-violet-400 bg-violet-500/10 border-violet-500/25",
  },
  sky: {
    icon: "text-sky-400 bg-sky-500/10 border-sky-500/25",
  },
};

function CompetitorComparison() {
  return (
    <section className="max-w-5xl mx-auto px-6 md:px-12 py-20">
      <Reveal className="text-center mb-14 max-w-2xl mx-auto">
        <p className="text-xs text-verdict-accept font-mono-ui uppercase tracking-widest font-semibold mb-3">
          What "verified" actually means
        </p>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          A solved problem doesn't stop at "Accepted."
        </h2>
        <p className="text-zinc-400">
          Most DSA practice tools end the moment you close the tab. Here's
          what happens to a solve after that.
        </p>
      </Reveal>

      <Reveal className="grid md:grid-cols-3 gap-5">
        {STAGES.map((s) => {
          const a = ACCENT[s.accent];
          return (
            <div
              key={s.id}
              className="bg-ink-800 border border-ink-700 hover:border-zinc-700 rounded-2xl p-6 transition-colors flex flex-col"
            >
              <span
                className={`inline-flex items-center justify-center w-11 h-11 rounded-xl border mb-4 ${a.icon}`}
                aria-hidden="true"
              >
                <s.Icon size={19} strokeWidth={2.2} />
              </span>
              <p className="text-[11px] font-mono-ui uppercase tracking-widest text-zinc-500 mb-1.5">
                {s.eyebrow}
              </p>
              <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{s.body}</p>
            </div>
          );
        })}
      </Reveal>
    </section>
  );
}

export default CompetitorComparison;