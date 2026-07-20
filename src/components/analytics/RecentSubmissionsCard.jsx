function RecentSubmissionsCard({ submissions }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Submissions</h2>

      <div className="space-y-3">
        {submissions.slice(0, 10).map((submission) => (
          <div
            key={submission._id || submission.id}
            className="bg-zinc-800 px-4 py-3 rounded-xl flex items-center justify-between"
          >
            <div>
              <p className="font-semibold">
                {submission.problemTitle || submission.problemSlug}
              </p>
              <p className="text-zinc-400 text-sm">{submission.language}</p>
            </div>
            <span className="text-sm">{submission.status}</span>
          </div>
        ))}

        {submissions.length === 0 && (
          <p className="text-zinc-400">No submissions yet.</p>
        )}
      </div>
    </div>
  );
}

export default RecentSubmissionsCard;
