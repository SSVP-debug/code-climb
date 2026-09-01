import { Link } from "react-router-dom";
import SectionCard from "../ui/layout/SectionCard";
import { useAppContext } from "../../hooks/useAppContext";
import { useTheme } from "../../hooks/useTheme";
import { Sparkles } from "lucide-react";

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
  const { theme } = useTheme();

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
    <SectionCard title="Complete Your Profile" icon={<Sparkles size={18} strokeWidth={2} />} accented>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold">{percent}% complete</span>
        <span className="text-xs text-[var(--muted-foreground)]">{doneCount}/{checklist.length}</span>
      </div>
      <div className="h-2 bg-[var(--surface-elevated)] rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percent}%`, backgroundColor: theme.colors.primary }}
        />
      </div>

      <div className="space-y-2">
        {checklist.filter((c) => !c.done).map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="flex items-center gap-2.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition group"
          >
            <span className="w-4 h-4 rounded-full border border-[var(--border-strong)] flex-shrink-0 group-hover:border-[var(--theme-primary,#2dd4bf)] transition" />
            {item.label}
            <span className="ml-auto text-[var(--muted-foreground)] group-hover:text-[var(--theme-primary,#2dd4bf)] transition">→</span>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}

export default ProfileCompletion;