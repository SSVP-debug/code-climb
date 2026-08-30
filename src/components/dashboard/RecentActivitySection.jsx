function RecentActivitySection({
  recentActivity,
}) {

  return (
    <div className="mt-10 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)]">

      <h2 className="text-2xl font-semibold mb-6">
        Recent Activity
      </h2>

      <div className="space-y-4">

        {recentActivity.length === 0 ? (

          <p className="text-[var(--muted-foreground)]">
            No recent activity yet.
          </p>

        ) : (

          recentActivity.map(
            (activity, index) => (

              <div
                key={index}
                className="bg-[var(--surface-elevated)] p-4 rounded-xl"
              >

                <p className="font-semibold">
                  Solved "{activity.title}"
                </p>

                <p className="text-[var(--muted-foreground)] text-sm mt-1">
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