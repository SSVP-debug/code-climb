import {
  getProfileData,
} from "../../utils/analyticsUtils";

import {
  getUserRank,
} from "../../utils/analyticsUtils";

function PublicProfileCard() {

  const profile =
    getProfileData();

  const rank =
    getUserRank();

  return (

    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

      <div className="flex items-center justify-between mb-6">

        <div>

          <p className="text-zinc-400 text-sm">

            Public Developer Profile

          </p>

          <h2 className="text-3xl font-bold mt-2">

            {rank}

          </h2>

        </div>

        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-black text-2xl font-bold">

          C

        </div>

      </div>

      <div className="grid grid-cols-2 gap-4">

        <div className="bg-zinc-800 rounded-xl p-4">

          <p className="text-zinc-400 text-sm">

            Solved

          </p>

          <h3 className="text-2xl font-bold mt-2">

            {
              profile.totalSolved
            }

          </h3>

        </div>

        <div className="bg-zinc-800 rounded-xl p-4">

          <p className="text-zinc-400 text-sm">

            Submissions

          </p>

          <h3 className="text-2xl font-bold mt-2">

            {
              profile.totalSubmissions
            }

          </h3>

        </div>

        <div className="bg-zinc-800 rounded-xl p-4">

          <p className="text-zinc-400 text-sm">

            Topics

          </p>

          <h3 className="text-2xl font-bold mt-2">

            {
              profile.topicsSolved
            }

          </h3>

        </div>

        <div className="bg-zinc-800 rounded-xl p-4">

          <p className="text-zinc-400 text-sm">

            Joined

          </p>

          <h3 className="text-lg font-bold mt-2">

            {
              profile.joinedDate
            }

          </h3>

        </div>

      </div>

    </div>

  );
}

export default PublicProfileCard;