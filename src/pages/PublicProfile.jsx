import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function PublicProfile() {
  const { username } = useParams();

  const [profile, setProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch(
          `${
            import.meta.env
              .VITE_API_URL
          }/api/public/u/${username}`
        );

        if (!response.ok) {
          throw new Error(
            "Profile not found"
          );
        }

        const data =
          await response.json();

        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="p-10">
        Loading profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8">

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">

        <h1 className="text-4xl font-bold">
          {profile.displayName}
        </h1>

        <p className="text-zinc-400 mt-2">
          @{profile.username}
        </p>

        <div className="grid grid-cols-2 gap-4 mt-8">

          <div className="bg-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400">
              Level
            </p>

            <p className="text-3xl font-bold">
              {profile.level}
            </p>
          </div>

          <div className="bg-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400">
              XP
            </p>

            <p className="text-3xl font-bold">
              {profile.totalXP}
            </p>
          </div>

          <div className="bg-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400">
              Solved
            </p>

            <p className="text-3xl font-bold">
              {profile.solvedCount}
            </p>
          </div>

          <div className="bg-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400">
              Current Streak
            </p>

            <p className="text-3xl font-bold">
              {profile.currentStreak}
            </p>
          </div>

        </div>

        <div className="mt-8">

          <p className="text-zinc-400">
            Longest Streak
          </p>

          <p className="text-xl font-semibold">
            {profile.longestStreak}
          </p>

          <p className="text-zinc-400 mt-4">
            Joined
          </p>

          <p>
            {new Date(
              profile.joinedDate
            ).toLocaleDateString()}
          </p>

        </div>

      </div>

    </div>
  );
}

export default PublicProfile;