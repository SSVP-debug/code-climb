import React from "react";
import HintSystem from "./HintSystem.jsx";
import EditorialPanel from "./EditorialPanel.jsx";
import RelatedProblems from "./RelatedProblems.jsx";

function ProblemInfo({ problem }) {
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

      {/* Progressive hints */}
      <HintSystem hints={problem.hints} />

      {/* Editorial — full write-up, gated behind solve-to-unlock/premium */}
      <EditorialPanel slug={problem.slug} />

      {/* Related problems */}
      <RelatedProblems
        relatedSlugs={problem.relatedProblems}
        currentSlug={problem.slug}
      />
    </div>
  );
}

export default ProblemInfo;