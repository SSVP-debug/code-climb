function RecentActivitySection({
  recentActivity,
}) {

  return (
    <div className="mt-10 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">

      <h2 className="text-2xl font-semibold mb-6">
        Recent Activity
      </h2>

      <div className="space-y-4">

        {recentActivity.length === 0 ? (

          <p className="text-zinc-400">
            No recent activity yet.
          </p>

        ) : (

          recentActivity.map(
            (activity, index) => (

              <div
                key={index}
                className="bg-zinc-800 p-4 rounded-xl"
              >

                <p className="font-semibold">
                  Solved "{activity.title}"
                </p>

                <p className="text-zinc-400 text-sm mt-1">
                  {activity.time}
                </p>

              </div>

            )
          )

        )}

      </div>

    </div>
  );
}

export default RecentActivitySection;