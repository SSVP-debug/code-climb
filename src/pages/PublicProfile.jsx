import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  ACHIEVEMENT_METADATA,
} from "../config/achievementMetadata";

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
          `${import.meta.env.VITE_API_URL}/api/public/u/${username}`
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
    <div className="max-w-4xl mx-auto p-8">

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">

        {/* Header */}

        <h1 className="text-4xl font-bold">
          {profile.displayName}
        </h1>

        <p className="text-zinc-400 mt-2">
          @{profile.username}
        </p>

        {/* Stats */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">

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

        {/* Additional Info */}

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

        {/* Achievements */}

        <div className="mt-10">

          <h2 className="text-2xl font-bold mb-4">
            Achievements
          </h2>

          <div className="grid gap-3">

            {profile.achievements?.map(
              (achievement) => {
                const meta =
                  ACHIEVEMENT_METADATA[
                    achievement.key
                  ];

                if (!meta) return null;

                return (
                  <div
                    key={achievement.key}
                    className="bg-zinc-800 rounded-xl p-4"
                  >
                    <h3 className="font-semibold">
                      🏆 {meta.publicTitle}
                    </h3>

                    <p className="text-zinc-400 text-sm mt-1">
                      {meta.description}
                    </p>
                  </div>
                );
              }
            )}

          </div>

        </div>

        {/* Difficulty Breakdown */}

        <div className="mt-10">

          <h2 className="text-2xl font-bold mb-4">
            Difficulty Breakdown
          </h2>

          <div className="grid grid-cols-3 gap-4">

            <div className="bg-zinc-800 rounded-xl p-4">
              <p className="text-zinc-400">
                Easy
              </p>

              <p className="text-2xl font-bold">
                {profile.solvedDifficulty?.easy || 0}
              </p>
            </div>

            <div className="bg-zinc-800 rounded-xl p-4">
              <p className="text-zinc-400">
                Medium
              </p>

              <p className="text-2xl font-bold">
                {profile.solvedDifficulty?.medium || 0}
              </p>
            </div>

            <div className="bg-zinc-800 rounded-xl p-4">
              <p className="text-zinc-400">
                Hard
              </p>

              <p className="text-2xl font-bold">
                {profile.solvedDifficulty?.hard || 0}
              </p>
            </div>

          </div>

        </div>

        {/* Topic Coverage */}

        <div className="mt-10">

          <h2 className="text-2xl font-bold mb-4">
            Topic Coverage
          </h2>

          <div className="grid gap-3">

            {Object.entries(
              profile.topicStats || {}
            ).map(
              ([topic, count]) => (
                <div
                  key={topic}
                  className="bg-zinc-800 rounded-xl p-4 flex justify-between"
                >
                  <span>{topic}</span>

                  <span className="font-bold">
                    {count}
                  </span>
                </div>
              )
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default PublicProfile;