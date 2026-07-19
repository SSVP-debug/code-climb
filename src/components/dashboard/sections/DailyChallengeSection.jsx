import { useEffect, useState } from "react";
import { useAppContext } from "../../../hooks/useAppContext";
import {
  getDailyChallenge,
} from "../../../utils/dailyChallenge";

import { useTheme } from "../../../context/ThemeContext";
import SectionCard from "../../ui/layout/SectionCard";
import Button from "../../ui/Button";
import { CheckCircle2 } from "lucide-react";

function DailyChallengeSection() {
  const { theme } = useTheme();
  const [challenge, setChallenge] = useState(null);

  const {
    dailyChallengeHistory,
  } = useAppContext();

  useEffect(() => {
    let cancelled = false;
    getDailyChallenge().then((dc) => {
      if (!cancelled) setChallenge(dc);
    });
    return () => { cancelled = true; };
  }, []);

  if (!challenge) {
    return (
      <SectionCard accented>
        <div className="text-zinc-500 text-sm">Loading today's challenge…</div>
      </SectionCard>
    );
  }

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

    <SectionCard accented>

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
        <div className="inline-flex items-center gap-2 bg-green-500 text-black px-6 py-3 rounded-xl font-semibold">
          <CheckCircle2 size={18} strokeWidth={2.5} aria-hidden="true" />
          Completed Today
        </div>
      ) : (
        <Button to={`/problems/${challenge.slug}`} variant="theme">
          {theme.words.solveChallenge}
        </Button>
      )}

    </SectionCard>

  );
}

export default DailyChallengeSection;