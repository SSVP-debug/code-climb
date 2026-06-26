import { Link } from "react-router-dom";
import SectionCard from "../../ui/layout/SectionCard";
import { useAppContext } from "../../../hooks/useAppContext";

function ContinueLearningSection() {
  const { submissions } = useAppContext();

  const latestSubmission = submissions[0] ?? null;
  console.log(latestSubmission);

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

        <Link
          to="/problems"
          className="inline-block bg-green-500 hover:bg-green-600 transition text-black px-6 py-3 rounded-xl font-semibold"
        >
          Explore Problems
        </Link>
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

          <pre className="text-xs text-white">
            {JSON.stringify(latestSubmission, null, 2)}
          </pre>

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

        <Link
          to={`/problems/${latestSubmission.problemSlug}`}
          className="bg-green-500 hover:bg-green-600 transition text-black px-6 py-3 rounded-xl font-semibold"
        >
          Continue →
        </Link>

      </div>

      <pre className="text-xs text-white">
        {JSON.stringify(latestSubmission, null, 2)}
      </pre>
    </SectionCard>
  );
}

export default ContinueLearningSection;