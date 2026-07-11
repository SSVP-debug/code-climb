import SectionCard from "../../ui/layout/SectionCard";
import Button from "../../ui/Button";
import { useAppContext } from "../../../hooks/useAppContext";

function ContinueLearningSection() {
  const { submissions } = useAppContext();

  const latestSubmission =
    submissions?.length > 0
      ? submissions[submissions.length - 1]
      : null;


  if (!latestSubmission) {
    return (
      <SectionCard
        title="Continue Learning"
        subtitle="Start your journey"
      >
        <p className="text-zinc-400 mb-6">
          You haven't solved any problems yet.
          Begin with your first challenge.
        </p>

        <Button to="/problems">
          Explore Problems
        </Button>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Continue Learning"
      subtitle="Pick up where you left off"
    >
      <div className="flex items-center justify-between flex-wrap gap-6">

        <div>

          {/* Debug output removed */}

          <h3 className="text-2xl font-bold">
            {latestSubmission.problemTitle}
          </h3>

          <p className="text-zinc-400 mt-2">
            Last attempt:
            <span
              className={`ml-2 font-medium ${latestSubmission.status === "Accepted"
                ? "text-green-400"
                : "text-red-400"
                }`}
            >
              {latestSubmission.status}
            </span>
          </p>
        </div>

        <Button to={`/problems/${latestSubmission.problemSlug ?? latestSubmission.problemId}`}>
          Continue →
        </Button>

      </div>

      {/* Debug output removed */}
    </SectionCard>
  );
}

export default ContinueLearningSection;