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
import { FileQuestion } from "lucide-react";
import PageMeta from "../components/seo/PageMeta";
import DashboardLayout from "../layouts/DashboardLayout";
import ProblemLayout from "../layouts/ProblemLayout";
import { useProblem } from "../hooks/useProblem";
import { useProblemSolver } from "../hooks/useProblemSolver";
import ProblemSolverMobileView from "../components/problem/ProblemSolverMobileView";
import ProblemSolverDesktopView from "../components/problem/ProblemSolverDesktopView";
import ProblemDetailsSkeleton from "../components/problem/ProblemDetailsSkeleton";
import EmptyState from "../components/ui/feedback/EmptyState";

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
        <ProblemDetailsSkeleton />
      </DashboardLayout>
    );
  }

  if (error || !problem) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <EmptyState
            icon={<FileQuestion size={28} strokeWidth={1.75} />}
            title="Problem Not Found"
            description={error || "The problem you're looking for doesn't exist or has been moved."}
            actionLabel="Go Back"
            onAction={() => window.history.back()}
          />
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