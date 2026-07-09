function StreakBadge({ streak, size = "sm" }) {
  if (!streak || streak <= 0) return null;

  const styles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-bold bg-orange-500/10 border border-orange-500/20 text-orange-400 ${styles[size]}`}
      title={`${streak}-day streak! Keep it going.`}
    >
      <span>🔥</span>
      <span>{streak}</span>
      <span className="text-orange-500/60 font-normal">
        {streak === 1 ? "day" : "days"}
      </span>
    </div>
  );
}

export default StreakBadge;