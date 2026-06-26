import { Link } from "react-router-dom";
import SectionCard from "../ui/layout/SectionCard";
import { useAppContext } from "../../hooks/useAppContext";

function ContinueLearningCard() {
  const { submissions } = useAppContext();

  const latestSubmission =
    submissions.length > 0
      ? submissions[0]
      : null;

  if (!latestSubmission) {
    return (
      <SectionCard
        title="Continue Learning"
        subtitle="Start your interview journey."
      >
        <div className="flex items-center justify-between gap-4">

          <div>
            <h3 className="text-lg font-semibold">
              No recent activity
            </h3>

            <p className="text-zinc-400 mt-1">
              Solve your first problem to begin tracking your progress.
            </p>
          </div>

          <Link
            to="/problems"
            className="text-green-400 hover:text-green-300 font-medium"
          >
            Explore →
          </Link>

        </div>
      </SectionCard>
    );
  }

  const statusColor =
    latestSubmission.status === "Accepted"
      ? "text-green-400"
      : latestSubmission.status === "Wrong Answer"
        ? "text-red-400"
        : "text-yellow-400";

  return (
    <SectionCard
      title="Continue Learning"
      subtitle="Resume where you left off."
    >
      <div className="flex items-center justify-between">

        {/* Left */}

        <div>

          <h3 className="text-lg font-semibold">
            {latestSubmission.problemTitle}
          </h3>

          <div className="flex flex-wrap gap-4 mt-2 text-sm">

            <span className={statusColor}>
              {latestSubmission.status}
            </span>

            <span className="text-zinc-400">
              {latestSubmission.language}
            </span>

            <span className="text-zinc-500">
              {latestSubmission.date}
            </span>

          </div>

        </div>

        {/* Right */}

        <Link
          to={`/problems/${latestSubmission.problemSlug}`}
          className="bg-green-500 hover:bg-green-600 transition px-4 py-2 rounded-xl font-semibold text-black"
        >
          Continue
        </Link>

      </div>
    </SectionCard>
  );
}

export default ContinueLearningCard;