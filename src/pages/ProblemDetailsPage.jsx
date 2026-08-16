/**
 * ProblemDetailsPage — fetches a problem by slug and renders the solver UI.
 *
 * This file used to be 575 lines mixing data-fetching, layout, and the
 * entire run/submit business logic together (Staff review §4/§9/#12). It's
 * now just wiring:
 *   - useProblem            → fetch + loading/error state
 *   - useProblemSolver       → all editor/run/submit state and handlers
 *   - ProblemWorkspaceLayout  → presentation (single tree, desktop+mobile)
 */
import { useParams, useSearchParams } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import PageMeta from "../components/seo/PageMeta";
import DashboardLayout from "../layouts/DashboardLayout";
import ProblemLayout from "../layouts/ProblemLayout";
import { useProblem } from "../hooks/useProblem";
import { useProblemSolver } from "../hooks/useProblemSolver";
import ProblemWorkspaceLayout from "../components/problem/ProblemWorkspaceLayout";
import ProblemDetailsSkeleton from "../components/problem/ProblemDetailsSkeleton";
import EmptyState from "../components/ui/feedback/EmptyState";

function ProblemDetailsPage() {
  const { slug } = useParams();
  // Contest problem links pass ?contest=<id> so this page can report the
  // solve back to the contest's score/solvedSlugs (backend endpoint:
  // POST /api/contests/:id/solve). See ContestDetailPage.jsx.
  const [searchParams] = useSearchParams();
  const contestId = searchParams.get("contest");
  // Battle Room problem links pass ?battleRoom=<id> so this page can
  // report the solve back to the room's team score (backend: the
  // battleRoomId this sends through POST /api/judge/submit — see
  // backend/services/battleRoomScoring.js). See BattleRoomDetailPage.jsx.
  const battleRoomId = searchParams.get("battleRoom");
  // Set by LearningPathProblemItem when this problem was opened from
  // inside a Learning Path — see useProblem.js for how this feeds the
  // Next Best Problem recommendation.
  const pathId = searchParams.get("path");
  // Set by MissionCard when this problem was opened from a Code Club
  // Edition mission. Purely a client-side display concern (which mission
  // banner to render, see MissionHeader.jsx) — unlike `path` above, this
  // never reaches the backend or the recommendation engine.
  const editionChapterId = searchParams.get("edition");
  const { problem, loading, error, prevSlug, nextSlug, nextBestProblem } = useProblem(slug, pathId);

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
      nextBestProblem={nextBestProblem}
      contestId={contestId}
      battleRoomId={battleRoomId}
      editionChapterId={editionChapterId}
    />
  );
}

function ProblemSolver({ problem, slug, prevSlug, nextSlug, nextBestProblem, contestId, battleRoomId, editionChapterId }) {
  const solver = useProblemSolver({ problem, slug, contestId, battleRoomId });

  return (
    <>
      <PageMeta
        title={`${problem.title} · Code Club`}
        description={`Solve ${problem.title} (${problem.difficulty}) in Python, JavaScript, Java, or C++. ${problem.description?.slice(0, 100) ?? ""}…`}
        path={`/problems/${problem.slug}`}
        type="article"
      />
      <ProblemLayout title={problem.title} prevSlug={prevSlug} nextSlug={nextSlug}>
        <ProblemWorkspaceLayout
          problem={problem}
          slug={slug}
          solver={solver}
          nextBestProblem={nextBestProblem}
          editionChapterId={editionChapterId}
        />
      </ProblemLayout>
    </>
  );
}

export default ProblemDetailsPage;