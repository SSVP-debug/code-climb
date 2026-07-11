import { useAppContext } from "../../../hooks/useAppContext";
import {
  getDailyChallenge,
} from "../../../utils/dailyChallenge";

import { useTheme } from "../../../context/ThemeContext";
import SectionCard from "../../ui/layout/SectionCard";
import Button from "../../ui/Button";

function DailyChallengeSection() {
  const { theme } = useTheme();

  

  const challenge =
    getDailyChallenge();
  const {
    dailyChallengeHistory,
  } = useAppContext();

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const completedToday =
    dailyChallengeHistory.some(
      (entry) =>
        entry.date === today &&
        entry.slug === challenge.slug
    );

  return (

    <SectionCard>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">

        <div className="min-w-0">

          <p className="text-zinc-400 text-sm">

            {theme.words.dailyChallenge}

          </p>

          <h2 className="text-xl sm:text-3xl font-bold mt-2 break-words">

            {challenge.title}

          </h2>

        </div>

        <div className="text-right flex-shrink-0">

          <p className="text-zinc-400 text-sm">

            {theme.words.difficulty}

          </p>

          <h2 className="text-xl font-semibold mt-2">

            {challenge.difficulty}

          </h2>

        </div>

      </div>

      <p className="text-zinc-400 leading-7 mb-6">

        {challenge.description}

      </p>

      {completedToday ? (
        <div className="inline-flex items-center bg-green-500 text-black px-6 py-3 rounded-xl font-semibold">
          ✅ Completed Today
        </div>
      ) : (
        <Button to={`/problems/${challenge.slug}`}>
          {theme.words.solveChallenge}
        </Button>
      )}

    </SectionCard>

  );
}

export default DailyChallengeSection;