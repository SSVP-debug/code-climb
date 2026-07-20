/**
 * ProblemDetailsPage — fetches a problem by slug and renders the solver UI.
 *
 * This file used to be 575 lines mixing data-fetching, layout, and the
 * entire run/submit business logic together (Staff review §4/§9/#12). It's
 * now just wiring:
 *   - useProblem            → fetch + loading/error state
 *   - useProblemSolver       → all editor/run/submit state and handlers
 *   - ProblemSolverMobileView / ProblemSolverDesktopView → presentation
 */
import { useParams, useSearchParams } from "react-router-dom";
import PageMeta from "../components/seo/PageMeta";
import DashboardLayout from "../layouts/DashboardLayout";
import ProblemLayout from "../layouts/ProblemLayout";
import { useProblem } from "../hooks/useProblem";
import { useProblemSolver } from "../hooks/useProblemSolver";
import ProblemSolverMobileView from "../components/problem/ProblemSolverMobileView";
import ProblemSolverDesktopView from "../components/problem/ProblemSolverDesktopView";

function ProblemDetailsPage() {
  const { slug } = useParams();
  // Contest problem links pass ?contest=<id> so this page can report the
  // solve back to the contest's score/solvedSlugs (backend endpoint:
  // POST /api/contests/:id/solve). See ContestDetailPage.jsx.
  const [searchParams] = useSearchParams();
  const contestId = searchParams.get("contest");
  const { problem, loading, error, prevSlug, nextSlug } = useProblem(slug);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm">Loading problem…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !problem) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Problem Not Found</h2>
            <p className="text-zinc-500 mb-6">
              {error || "The problem you're looking for doesn't exist or has been moved."}
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ProblemSolver
      key={slug}
      problem={problem}
      slug={slug}
      prevSlug={prevSlug}
      nextSlug={nextSlug}
      contestId={contestId}
    />
  );
}

function ProblemSolver({ problem, slug, prevSlug, nextSlug, contestId }) {
  const solver = useProblemSolver({ problem, slug, contestId });

  return (
    <>
      <PageMeta
        title={`${problem.title} · Code Club`}
        description={`Solve ${problem.title} (${problem.difficulty}) in Python, JavaScript, Java, or C++. ${problem.description?.slice(0, 100) ?? ""}…`}
        path={`/problems/${problem.slug}`}
        type="article"
      />
      <ProblemLayout title={problem.title} prevSlug={prevSlug} nextSlug={nextSlug}>
        <ProblemSolverMobileView problem={problem} slug={slug} solver={solver} />
        <ProblemSolverDesktopView problem={problem} slug={slug} solver={solver} />
      </ProblemLayout>
    </>
  );
}

export default ProblemDetailsPage;