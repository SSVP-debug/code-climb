import { useState } from "react";
import { fetchLeetCodeStats, saveLeetCodeStats } from "../../services/leetcode";

const DIFFICULTY_KEYS = ["easySolved", "mediumSolved", "hardSolved"];

/**
 * Connects a user's LeetCode account.
 * Supports API sync and manual self-reported stats.
 */
function ConnectLeetCodeSection({ initial }) {
  const [username, setUsername] = useState(initial?.username || "");
  const [stats, setStats] = useState(
    // Keyed off username, not totalSolved — a freshly-connected user with
    // 0 problems solved still has a real `stats` object (all zeros), not
    // null. Falling back to totalSolved-truthiness here previously meant
    // a connected user with 0 solves would render as "not connected."
    initial?.totalSolved
      ? {
        easySolved: initial.easySolved || 0,
        mediumSolved: initial.mediumSolved || 0,
        hardSolved: initial.hardSolved || 0,
      }
      : null
  );
  const [isConnected, setIsConnected] = useState(Boolean(initial?.username));

  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [manualMode, setManualMode] = useState(false);

  async function handleSync() {
    if (!username.trim()) return;
    setSyncing(true);
    setError(null);
    try {
      const data = await fetchLeetCodeStats(username.trim());
      setStats({
        easySolved: data.easySolved,
        mediumSolved: data.mediumSolved,
        hardSolved: data.hardSolved,
      });
      setManualMode(false);
    } catch (err) {
      // The unofficial API this proxies isn't something we control the
      // uptime of — fall back to manual entry rather than dead-ending here.
      setError(`${err.message} You can enter your solved counts manually below instead.`);
      setManualMode(true);
    } finally {
      setSyncing(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const result = await saveLeetCodeStats({
        username: username.trim(),
        easySolved: stats?.easySolved || 0,
        mediumSolved: stats?.mediumSolved || 0,
        hardSolved: stats?.hardSolved || 0,
        source: manualMode ? "manual" : "api",
      });
      setStats({
        easySolved: result.leetcodeStats.easySolved,
        mediumSolved: result.leetcodeStats.mediumSolved,
        hardSolved: result.leetcodeStats.hardSolved,
      });
      setIsConnected(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit() {
    setUsername("");
    setStats(null);
    setIsConnected(false);
    setManualMode(false);
    // Disconnecting locally only clears the form — it doesn't call the
    // backend to erase saved stats. Re-syncing/saving overwrites them;
    // there's no dedicated "delete" endpoint since a stale-but-present
    // LeetCode stat on a public profile isn't harmful the way stale XP
    // would be.
  }

  const totalSolved = stats
    ? (stats.easySolved || 0) + (stats.mediumSolved || 0) + (stats.hardSolved || 0)
    : 0;

  if (isConnected && stats) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap bg-zinc-800 rounded-xl p-4">
          <div className="min-w-0">
            <p className="text-sm text-zinc-400">LeetCode</p>
            <p className="font-semibold text-green-400 truncate">@{username}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {totalSolved} solved — {stats.easySolved} Easy, {stats.mediumSolved} Medium, {stats.hardSolved} Hard
            </p>
          </div>
          <button
            onClick={handleEdit}
            className="flex-shrink-0 bg-zinc-700 hover:bg-zinc-600 transition px-4 py-2 rounded-lg text-sm"
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        Show recruiters your LeetCode solve history alongside Code Club sync automatically or enter your numbers.
      </p>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="LeetCode username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="flex-1 min-w-[180px] bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-xl outline-none focus:border-green-500 transition"
        />
        <button
          onClick={handleSync}
          disabled={!username.trim() || syncing}
          className="bg-green-500 hover:bg-green-600 disabled:opacity-50 transition px-5 py-3 rounded-xl font-semibold text-black"
        >
          {syncing ? "Syncing…" : "Sync"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {(manualMode || stats) && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">
            {manualMode
              ? "Self-reported counts"
              : "Synced from LeetCode"}
          </p>
          {!manualMode && (
            <p className="text-sm text-zinc-400">
              These values were fetched from LeetCode and cannot be edited.
            </p>
          )}
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTY_KEYS.map((key) => (
              <div key={key}>
                <label className="block text-xs text-zinc-500 mb-1 capitalize">
                  {key.replace("Solved", "")}
                </label>
                <input
                  type="number"
                  min="0"
                  value={stats?.[key] ?? 0}
                  readOnly={!manualMode}
                  onChange={(e) => {
                    if (!manualMode) return;

                    setStats((s) => ({
                      ...(s || {}),
                      [key]: Math.max(0, parseInt(e.target.value) || 0),
                    }));
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-sm outline-none ${manualMode
                    ? "bg-zinc-800 border border-zinc-700 focus:border-green-500/50"
                    : "bg-zinc-950 border border-zinc-800 text-zinc-400 cursor-not-allowed"
                    }`}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !username.trim()}
            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 transition py-2.5 rounded-lg font-semibold text-black text-sm"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}

      {!manualMode && !stats && (
        <button
          onClick={() => {
            setManualMode(true);
            setStats({ easySolved: 0, mediumSolved: 0, hardSolved: 0 });
          }}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition"
        >
          Enter counts manually instead
        </button>
      )}
    </div>
  );
}

export default ConnectLeetCodeSection;