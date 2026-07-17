import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Flame, CheckCircle2, RotateCcw, Shuffle, CalendarCheck } from "lucide-react";
import { useAppContext } from "../hooks/useAppContext";
import { getDailyChallenge } from "../utils/dailyChallenge";
import { getLastVisitedProblem } from "../utils/recentProblem";

function AvatarDropdown({ user, onLogout, mobile = false }) {
  const [open, setOpen] = useState(false);
  const [dailyChallengeSlug, setDailyChallengeSlug] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { totalXP, currentStreak, solvedProblems, role } = useAppContext();
  const isStudent = role === "student" || !role;

  const lastVisitedSlug = getLastVisitedProblem();

  // Dynamic import: AvatarDropdown renders on most authenticated pages
  // (via Navbar → DashboardLayout), so a static import here would put the
  // ~7000-line problems catalog in the bundle for pages that never need
  // it (Settings, Pricing, etc.) just because they share a layout with
  // pages that do. Deferring to the click means the catalog only loads
  // when someone actually asks for a random problem.
  async function goToRandomProblem() {
    const { default: problems } = await import("../data/problems");
    const pick = problems[Math.floor(Math.random() * problems.length)];
    setOpen(false);
    navigate(`/problems/${pick.slug}`);
  }

  // Same reasoning for the Daily Challenge link — only resolve it once the
  // dropdown is actually opened, not on every page load.
  useEffect(() => {
    if (!open || dailyChallengeSlug) return;
    let cancelled = false;
    getDailyChallenge().then((dc) => {
      if (!cancelled) setDailyChallengeSlug(dc.slug);
    });
    return () => { cancelled = true; };
  }, [open, dailyChallengeSlug]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    function handleEscape(e) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="focus:outline-none"
      >
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName ?? "User"}
            className={mobile
              ? "w-8 h-8 rounded-full border border-zinc-700"
              : "w-9 h-9 rounded-full border border-zinc-700"}
          />
        ) : (
          <div
            className={mobile
              ? "w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-sm"
              : "w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-sm"}
          >
            {user?.displayName?.charAt(0)}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl overflow-hidden">
          <div className="px-4 py-4 border-b border-zinc-800">
            <p className="font-semibold">{user?.displayName}</p>
            <p className="text-xs text-zinc-400">{user?.email}</p>
          </div>

          {/* Quick Stats — recruiter/TPO/admin accounts don't have XP,
              streaks, or solved counts in any meaningful sense. */}
          {isStudent && (
          <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-zinc-800">
            <div className="flex flex-col items-center gap-1">
              <Zap size={14} className="text-yellow-400" />
              <span className="text-sm font-semibold">{totalXP ?? 0}</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">XP</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Flame size={14} className="text-orange-400" />
              <span className="text-sm font-semibold">{currentStreak ?? 0}</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Streak</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <CheckCircle2 size={14} className="text-green-400" />
              <span className="text-sm font-semibold">{solvedProblems?.length ?? 0}</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Solved</span>
            </div>
          </div>
          )}

          {/* Quick Actions — same reasoning: these all point at student
              problem-solving flows. */}
          {isStudent && (
          <div className="py-2 border-b border-zinc-800">
            <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Quick Actions
            </p>

            {lastVisitedSlug && (
              <Link
                to={`/problems/${lastVisitedSlug}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 hover:bg-zinc-800 text-sm"
              >
                <RotateCcw size={14} className="text-zinc-500" />
                Resume Problem
              </Link>
            )}

            <button
              onClick={goToRandomProblem}
              className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-zinc-800 text-sm text-left"
            >
              <Shuffle size={14} className="text-zinc-500" />
              Random Problem
            </button>

            {dailyChallengeSlug && (
              <Link
                to={`/problems/${dailyChallengeSlug}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 hover:bg-zinc-800 text-sm"
              >
                <CalendarCheck size={14} className="text-zinc-500" />
                Daily Challenge
              </Link>
            )}
          </div>
          )}

          <div className="py-2">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 hover:bg-zinc-800"
            >
              View Profile
            </Link>

            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 hover:bg-zinc-800"
            >
              Settings
            </Link>

            <Link
              to="/pricing"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 hover:bg-zinc-800"
            >
              Pricing
            </Link>
          </div>

          <div className="border-t border-zinc-800 p-2">
            <button
              onClick={onLogout}
              className="w-full rounded-lg bg-white text-black py-2 font-semibold hover:bg-zinc-200"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AvatarDropdown;