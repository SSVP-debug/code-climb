import {
  getUserRank,
  getUserLevel,
} from "../../utils/analyticsUtils";

function RankProgressSection() {

  const rank =
    getUserRank();

  const level =
    getUserLevel();

  const progress =
    (level % 10) * 10;

  return (

    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

      <div className="flex items-center justify-between mb-6">

        <div>

          <p className="text-zinc-400 text-sm">

            Current Rank

          </p>

          <h2 className="text-3xl font-bold mt-2">

            {rank}

          </h2>

        </div>

        <div className="text-right">

          <p className="text-zinc-400 text-sm">

            Level

          </p>

          <h2 className="text-3xl font-bold mt-2">

            {level}

          </h2>

        </div>

      </div>

      <div className="w-full bg-zinc-800 rounded-full h-4 overflow-hidden">

        <div
          className="bg-green-500 h-full transition-all duration-500"
          style={{
            width: `${progress}%`,
          }}
        />

      </div>

      <p className="text-zinc-400 text-sm mt-3">

        {10 - (level % 10)}
        {" "}
        more solves to next milestone

      </p>

    </div>

  );
}

export default RankProgressSection;