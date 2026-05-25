import {
  Link,
} from "react-router-dom";

import {
  getDailyChallenge,
} from "../../../utils/analyticsUtils";

function DailyChallengeSection() {

  const challenge =
    getDailyChallenge();

  return (

    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

      <div className="flex items-center justify-between mb-6">

        <div>

          <p className="text-zinc-400 text-sm">

            Daily Challenge

          </p>

          <h2 className="text-3xl font-bold mt-2">

            {challenge.title}

          </h2>

        </div>

        <div className="text-right">

          <p className="text-zinc-400 text-sm">

            Difficulty

          </p>

          <h2 className="text-xl font-semibold mt-2">

            {challenge.difficulty}

          </h2>

        </div>

      </div>

      <p className="text-zinc-400 leading-7 mb-6">

        {challenge.description}

      </p>

      <Link
        to={`/problems/${challenge.slug}`}
        className="inline-block bg-green-500 hover:bg-green-600 transition text-black px-6 py-3 rounded-xl font-semibold"
      >

        Solve Challenge

      </Link>

    </div>

  );
}

export default DailyChallengeSection;