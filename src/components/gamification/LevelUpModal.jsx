import { useEffect, useRef, useState } from "react";
import { useAppContext } from "../../hooks/useAppContext";
import { useTheme } from "../../hooks/useTheme";
import confetti from "canvas-confetti";
import { share } from "../../utils/share";
import { getLevel } from "../../utils/xpLevel";

export default function LevelUpModal() {
  const { totalXP } = useAppContext();
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const [newLevel, setNewLevel] = useState(null);
  const prevLevelRef = useRef(getLevel(totalXP));
  const timerRef = useRef(null);

  useEffect(() => {
    const current = getLevel(totalXP);
    const prev = prevLevelRef.current;
    if (current > prev && prev > 1) {
      setNewLevel(current);
      setVisible(true);
      prevLevelRef.current = current;
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.55 }, colors: ["#2dd4bf", "#facc15", "#f97316", "#a855f7"] });
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 4000);
    } else {
      prevLevelRef.current = current;
    }
    return () => clearTimeout(timerRef.current);
  }, [totalXP]);

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setVisible(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible]);

  if (!visible || !newLevel) return null;

  const messages = {
    codeHeist: "Crew reputation growing. New operations unlocked.",
    breakingBug: "Lab upgraded. More complex reactions await.",
    ghostProtocol: "Access level elevated. New systems online.",
    survivalCode: "You survived. The next game begins.",
    debugDynasty: "Valuation increased. More engineers reporting.",
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none" aria-live="polite">
      <div
        onClick={() => setVisible(false)}
        className="pointer-events-auto bg-zinc-900 border border-[var(--theme-primary,#2dd4bf)]/30 rounded-3xl p-8 text-center shadow-2xl shadow-[var(--theme-primary,#2dd4bf)]/20 max-w-xs w-full mx-4"
        style={{ animation: "levelUpPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
      >
        <div className="relative w-24 h-24 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full bg-[var(--theme-primary,#2dd4bf)]/20 animate-ping" />
          <div className="relative w-24 h-24 rounded-full bg-[var(--theme-primary,#2dd4bf)] flex items-center justify-center shadow-lg shadow-[var(--theme-primary,#2dd4bf)]/30">
            <span className="text-3xl font-black text-black">{newLevel}</span>
          </div>
        </div>
        <p className="text-xs text-[var(--theme-primary,#2dd4bf)] uppercase tracking-[0.2em] font-semibold mb-1">
          {theme.words?.level ?? "Level"} Up!
        </p>
        <h2 className="text-2xl font-black text-white mb-2">
          {theme.words?.level ?? "Level"} {newLevel}
        </h2>
        <p className="text-zinc-400 text-sm">{messages[theme.id] ?? "Keep solving. The next level awaits."}</p>
        <div className="mt-4 space-y-3">
          <button
            onClick={() =>
              share({
                title: "Level Up!",
                text: `I just reached Level ${newLevel} on Code Club!`,
                url: `${window.location.origin}/u/me`,
              })
            }
            className="w-full bg-[var(--theme-primary,#2dd4bf)] hover:brightness-110 transition rounded-xl py-2 font-semibold text-black"
          >
            Share
          </button>

          <p className="text-[10px] text-zinc-600">
            Click outside or press the card to dismiss
          </p>
        </div>
      </div>
      <style>{`@keyframes levelUpPop { from{opacity:0;transform:scale(0.6) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }`}</style>
    </div>
  );
}