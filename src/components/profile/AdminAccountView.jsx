import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import SectionCard from "../ui/layout/SectionCard";

/**
 * AdminAccountView — what an admin sees at /profile instead of the full
 * student Profile page.
 *
 * Admin UX audit (Phase UI-3, P0/P1, continued): fixing ThemeGate.jsx so
 * admin could actually reach /profile (see that file's comment) surfaced
 * a second problem — once there, Profile.jsx has no admin case at all.
 * Every section (XP/level/streak hero, resume card, GitHub/LinkedIn
 * connect prompts, profile-completion checklist, achievement gallery,
 * activity heatmap) assumes a student and, for an admin with none of
 * that data, renders as a wall of "0"s and empty states — not broken,
 * but not a real account view either, and a long way from "calm,
 * precise, trustworthy."
 *
 * Deliberately a separate, small component rather than threading
 * `role === "admin"` branches through Profile.jsx's ~20 sections: this
 * is a shared page (Student's primary identity surface, not admin's —
 * UI-1's ownership), so the safest change is one early return in
 * Profile.jsx pointing here, with zero risk of altering any of the
 * student rendering paths underneath. Kept intentionally minimal —
 * identity, role, join date, and a way back to the Console — since an
 * admin's real "account" surface is the platform they administer, not a
 * profile page. Logout is already reachable from the Navbar's own
 * account menu on this same page, so it isn't duplicated here.
 */
export default function AdminAccountView({ user, joinedDisplay }) {
  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-4xl font-bold">Account</h1>

      <SectionCard accented>
        <div className="flex items-start gap-4">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || "Admin"}
              className="w-16 h-16 rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-xl font-bold text-zinc-300 flex-shrink-0">
              {(user?.displayName || "A")[0]}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-semibold truncate">{user?.displayName || "Admin"}</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 shrink-0">
                <ShieldCheck size={11} />
                Administrator
              </span>
            </div>
            <p className="text-zinc-400 text-sm truncate">{user?.email}</p>
            <p className="text-zinc-500 text-sm mt-1">Joined {joinedDisplay}</p>
          </div>
        </div>
      </SectionCard>

      <p className="text-zinc-500 text-sm">
        Admin accounts don't have XP, streaks, or a public profile — those
        are student-facing. Platform management, users, and settings all
        live in the Admin Console.
      </p>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <Link to="/admin" className="text-white font-medium hover:underline">
          Open Admin Console →
        </Link>
        <Link to="/settings" className="text-zinc-400 hover:text-white transition">
          Account settings →
        </Link>
      </div>
    </div>
  );
}