import React from "react";
import { MessageSquareText } from "lucide-react";
import HintSystem from "./HintSystem.jsx";
import EditorialPanel from "./EditorialPanel.jsx";
import RelatedProblems from "./RelatedProblems.jsx";
import Button from "../ui/Button.jsx";
import { usePremium } from "../../context/PremiumContext";

function ProblemInfo({ problem, variant = "full" }) {
  const { monetizationEnabled, isPremium } = usePremium();
  if (!problem) return null;

  return (
    <div className="space-y-8 pb-8">
      {/* Description */}
      <section>
        <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
        <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap text-[15px]">
          {problem.description}
        </div>
      </section>

      {/* Examples */}
      {problem.examples && problem.examples.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-white mb-4">Examples</h3>
          <div className="space-y-6">
            {problem.examples.map((example, index) => (
              <div key={index} className="space-y-2">
                <p className="text-sm font-medium text-zinc-400">Example {index + 1}:</p>
                <div className="bg-zinc-900 border border-zinc-700/50 rounded-xl p-4 font-mono text-sm space-y-2">
                  <div>
                    <span className="text-zinc-500">Input: </span>
                    <span className="text-zinc-200">{example.input}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Output: </span>
                    <span className="text-zinc-200">{example.output}</span>
                  </div>
                  {example.explanation && (
                    <div>
                      <span className="text-zinc-500">Explanation: </span>
                      <span className="text-zinc-300 italic">{example.explanation}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Constraints */}
      {problem.constraints && problem.constraints.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-white mb-3">Constraints</h3>
          <ul className="list-disc list-inside space-y-2 text-zinc-400 text-sm ml-1">
            {problem.constraints.map((constraint, index) => (
              <li key={index} className="pl-1">
                <code className="bg-zinc-800/50 px-1.5 py-0.5 rounded text-zinc-300">
                  {constraint}
                </code>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Companies */}
      {problem.companies && problem.companies.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-white mb-3">Asked By</h3>
          <div className="flex flex-wrap gap-2">
            {problem.companies.map((company) => (
              <span
                key={company}
                className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-800/60 text-zinc-400 border border-zinc-700/50"
              >
                {company}
              </span>
            ))}
          </div>
        </section>
      )}

      {variant === "full" && (
        <>
          {/* Interview Mode launch — audit fix: this feature had no entry
              point anywhere in the app despite being fully built
              (InterviewModePage + backend /api/interview/*). Premium
              gating (this is a hard-gated Pro feature server-side) is
              still enforced by the backend either way; a proactive
              locked/upgrade state here is tracked as a follow-up once
              usePremium() lands. */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--theme-primary,#2dd4bf)]/10 text-[var(--theme-primary,#2dd4bf)] flex items-center justify-center flex-shrink-0">
                <MessageSquareText size={20} strokeWidth={2} aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  Try Interview Mode
                  {monetizationEnabled && !isPremium && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400">
                      Pro
                    </span>
                  )}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  45-minute timed session with an AI interviewer asking follow-up questions on this problem.
                </p>
              </div>
            </div>
            <Button to={`/interview-mode/${problem.slug}`} variant="secondary" size="sm">
              Start
            </Button>
          </section>

          {/* Progressive hints */}
          <HintSystem hints={problem.hints} />

          {/* Editorial — full write-up, gated behind solve-to-unlock/premium */}
          <EditorialPanel slug={problem.slug} />

          {/* Related problems */}
          <RelatedProblems
            relatedSlugs={problem.relatedProblems}
            currentSlug={problem.slug}
          />
        </>
      )}
    </div>
  );
}

export default ProblemInfo;