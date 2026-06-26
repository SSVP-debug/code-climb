import ContinueLearningCard from "./ContinueLearningCard";
import DailyMissionCard from "./DailyMissionCard";

function LearningWorkspace() {
  return (
    <section className="mb-8">
      <div className="mb-3">
        <h2 className="text-xl font-semibold">
          Learning Workspace
        </h2>

        <p className="text-zinc-400 text-sm mt-1">
          Continue your interview preparation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ContinueLearningCard />
        <DailyMissionCard />
      </div>
    </section>
  );
}

export default LearningWorkspace;