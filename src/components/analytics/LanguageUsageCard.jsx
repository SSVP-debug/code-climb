function LanguageUsageCard({ languageStats, favoriteLanguage }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h2 className="text-xl font-semibold mb-4">Language Usage</h2>

      <p className="text-zinc-400 text-sm mb-4">Favorite: {favoriteLanguage}</p>

      <div className="space-y-3">
        {Object.entries(languageStats).map(([lang, count]) => (
          <div
            key={lang}
            className="flex items-center justify-between bg-zinc-800 px-4 py-3 rounded-xl"
          >
            <span className="capitalize">{lang}</span>
            <span>{count} submissions</span>
          </div>
        ))}

        {Object.keys(languageStats).length === 0 && (
          <p className="text-zinc-400">No submissions yet.</p>
        )}
      </div>
    </div>
  );
}

export default LanguageUsageCard;
