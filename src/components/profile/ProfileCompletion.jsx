import { Link } from "react-router-dom";
import SectionCard from "../ui/layout/SectionCard";
import { useAppContext } from "../../hooks/useAppContext";

/**
 * ProfileCompletion
 *
 * The audit's mockup showed "82% complete → unlock 50 XP". The percentage
 * here is real, computed from actual profile state. The XP unlock is NOT
 * implemented — granting XP requires a new server-side hook (an
 * achievement-style write, same family as markProblemSolved) that's out of
 * scope for a frontend polish pass. Framed as "stand out to recruiters"
 * instead of promising a reward this doesn't deliver. If you want the XP
 * hook built, that's a small, well-scoped backend addition for a future
 * phase — flagging rather than faking it here.
 */
function ProfileCompletion() {
  const { username, leetcodeUsername, recruiterSnapshot, pinnedProblems } = useAppContext();

  const checklist = [
    { label: "Choose a username", done: Boolean(username), to: "/settings" },
    { label: "Connect LeetCode", done: Boolean(leetcodeUsername), to: "/settings" },
    {
      label: "Fill in Recruiter Snapshot",
      done: Boolean(
        recruiterSnapshot.availableForWork ||
        recruiterSnapshot.preferredRole ||
        recruiterSnapshot.expectedGraduation
      ),
      to: "/profile#profile-recruiter-snapshot",
    },
    { label: "Pin a favorite problem", done: pinnedProblems.length > 0, to: "/profile#profile-pinned-problems" },
  ];

  const doneCount = checklist.filter((c) => c.done).length;
  const percent = Math.round((doneCount / checklist.length) * 100);

  if (percent === 100) return null; // don't nag a fully-complete profile

  return (
    <SectionCard title="Complete Your Profile" icon="✨">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold">{percent}% complete</span>
        <span className="text-xs text-zinc-500">{doneCount}/{checklist.length}</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-green-500 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="space-y-2">
        {checklist.filter((c) => !c.done).map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="flex items-center gap-2.5 text-sm text-zinc-400 hover:text-white transition group"
          >
            <span className="w-4 h-4 rounded-full border border-zinc-600 flex-shrink-0 group-hover:border-green-400 transition" />
            {item.label}
            <span className="ml-auto text-zinc-600 group-hover:text-green-400 transition">→</span>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}

export default ProfileCompletion;