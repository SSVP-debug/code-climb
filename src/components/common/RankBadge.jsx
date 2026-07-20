import { Medal } from "lucide-react";

const RANK_STYLES = {
  1: { bg: "bg-yellow-500/15", ring: "ring-yellow-500/30", text: "text-yellow-400" },
  2: { bg: "bg-zinc-400/15", ring: "ring-zinc-400/30", text: "text-zinc-300" },
  3: { bg: "bg-orange-700/15", ring: "ring-orange-700/30", text: "text-orange-400" },
};

/**
 * RankBadge — gold/silver/bronze medal badge for ranks 1–3, plain "#N"
 * text for everything else. Single source of truth for rank styling,
 * used by LeaderboardPage, ContestDetailPage, and ClubPage so the same
 * "who's #1" visual language is consistent everywhere it appears.
 */
function RankBadge({ rank, size = 26 }) {
  const style = RANK_STYLES[rank];

  if (!style) {
    return (
      <span className="text-zinc-500 font-black text-sm">#{rank}</span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full ring-1 flex-shrink-0 ${style.bg} ${style.ring}`}
      style={{ width: size, height: size }}
    >
      <Medal
        size={Math.round(size * 0.55)}
        strokeWidth={2}
        className={style.text}
        aria-hidden="true"
      />
    </span>
  );
}

export default RankBadge;