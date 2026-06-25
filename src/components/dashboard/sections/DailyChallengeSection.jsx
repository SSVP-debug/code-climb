import {
  Link,
} from "react-router-dom";
import { useAppContext } from "../../../hooks/useAppContext";
import {
  getDailyChallenge,
} from "../../../utils/dailyChallenge";

import { useTheme } from "../../../context/ThemeContext";
import SectionCard from "../../ui/layout/SectionCard";

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

      <div className="flex items-center justify-between mb-6">

        <div>

          <p className="text-zinc-400 text-sm">

            {theme.words.dailyChallenge}

          </p>

          <h2 className="text-3xl font-bold mt-2">

            {challenge.title}

          </h2>

        </div>

        <div className="text-right">

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
        <Link
          to={`/problems/${challenge.slug}`}
          className="inline-block bg-green-500 hover:bg-green-600 transition text-black px-6 py-3 rounded-xl font-semibold"
        >
          {theme.words.solveChallenge}
        </Link>
      )}

    </SectionCard>

  );
}

export default DailyChallengeSection;