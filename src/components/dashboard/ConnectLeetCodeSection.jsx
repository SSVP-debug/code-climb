function ConnectLeetCodeSection({
  isConnected,
  username,
  setUsername,
  setIsConnected,
  setStats,
}) {

  return (
    <div className="mb-8">

      {!isConnected ? (

        <div>

          <p className="text-sm text-zinc-400 mb-3">
            Connect your LeetCode account to sync stats
          </p>

          <div className="flex gap-4">

            <input
              type="text"
              placeholder="Enter LeetCode username"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-xl w-[300px] outline-none focus:border-green-500 transition"
            />

            <button
              onClick={() => {

                if (username.trim()) {
                  setIsConnected(true);
                }

              }}
              className="bg-green-500 hover:bg-green-600 transition px-6 py-3 rounded-xl font-semibold text-black"
            >
              Connect
            </button>

          </div>

        </div>

      ) : (

        <div className="flex items-center gap-4">

          <div className="bg-zinc-900 border border-zinc-800 px-5 py-3 rounded-xl">

            <p className="text-sm text-zinc-400">
              Connected LeetCode Account
            </p>

            <p className="font-semibold text-green-400">
              @{username}
            </p>

          </div>

          <button
            onClick={() => {

              localStorage.removeItem(
                "leetcodeUsername"
              );

              setUsername("");

              setIsConnected(false);

              setStats(null);

            }}
            className="bg-zinc-800 hover:bg-zinc-700 transition px-4 py-3 rounded-xl"
          >
            Disconnect
          </button>

        </div>

      )}

    </div>
  );
}

export default ConnectLeetCodeSection;