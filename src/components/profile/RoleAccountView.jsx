import { useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, GraduationCap, Repeat } from "lucide-react";
import SectionCard from "../ui/layout/SectionCard";

// Role/profile isolation fix — see AdminAccountView.jsx's header comment
// for the original rationale (Admin UX audit, Phase UI-3): Profile.jsx is
// the Student's primary identity surface, so any other active role gets a
// small, separate early-return view instead of falling through into the
// XP/streak/achievement hero built for student data. AdminAccountView
// covers "admin"; this covers "tpo" and "recruiter" — the two roles that
// were previously showing leftover Student progress data on this exact
// page (see models/User.js's role/roles comment for the root cause).
//
// Kept role-agnostic (a single component, not TpoAccountView +
// RecruiterAccountView) since the two only differ in label/icon/dashboard
// link/profile subdocument — everything else (identity card, "why is this
// page small", switch-role affordance) is identical.
const ROLE_META = {
  tpo: {
    label: "TPO",
    badgeClass: "bg-violet-500/15 text-violet-300",
    icon: GraduationCap,
    dashboardPath: "/tpo/dashboard",
    dashboardLabel: "Open TPO Dashboard",
    describeProfile: (tpoProfile) =>
      tpoProfile?.collegeName
        ? `${tpoProfile.collegeName}${tpoProfile.verified ? " · Verified" : " · Verification pending"}`
        : null,
  },
  recruiter: {
    label: "Recruiter",
    badgeClass: "bg-sky-500/15 text-sky-300",
    icon: Briefcase,
    dashboardPath: "/recruiter/dashboard",
    dashboardLabel: "Open Recruiter Dashboard",
    describeProfile: (recruiterProfile) =>
      recruiterProfile?.companyName
        ? `${recruiterProfile.companyName}${recruiterProfile.verified ? " · Verified" : " · Verification pending"}`
        : null,
  },
};

export default function RoleAccountView({
  role,
  user,
  joinedDisplay,
  roles,
  switchActiveRole,
  tpoProfile,
  recruiterProfile,
}) {
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState(null);

  const meta = ROLE_META[role];
  if (!meta) return null;

  const Icon = meta.icon;
  const subProfile = role === "tpo" ? tpoProfile : recruiterProfile;
  const subtitle = meta.describeProfile(subProfile);

  // "Also authorized as" — everything in `roles` besides the one currently
  // active. Almost always empty (most accounts only ever have
  // ["student"] or one of ["tpo"]/["recruiter"]); when it's not, this is
  // the multi-role case the isolation fix exists to support.
  const otherRoles = (roles || []).filter((r) => r !== role && r !== "admin");

  async function handleSwitch(targetRole) {
    setSwitchError(null);
    setSwitching(true);
    try {
      await switchActiveRole(targetRole);
    } catch {
      setSwitchError("Couldn't switch roles. Please try again.");
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-4xl font-bold">Account</h1>

      <SectionCard accented>
        <div className="flex items-start gap-4">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || meta.label}
              className="w-16 h-16 rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-xl font-bold text-zinc-300 flex-shrink-0">
              {(user?.displayName || meta.label)[0]}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-semibold truncate">{user?.displayName || meta.label}</h2>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${meta.badgeClass}`}
              >
                <Icon size={11} />
                {meta.label}
              </span>
            </div>
            <p className="text-zinc-400 text-sm truncate">{user?.email}</p>
            {subtitle && <p className="text-zinc-500 text-sm truncate">{subtitle}</p>}
            <p className="text-zinc-500 text-sm mt-1">Joined {joinedDisplay}</p>
          </div>
        </div>
      </SectionCard>

      <p className="text-zinc-500 text-sm">
        {meta.label} accounts don't have XP, streaks, or solved-problem stats on this
        page — those belong to a Student session. Candidate search, dashboards, and
        role-specific tools live in your {meta.label} Dashboard.
      </p>

      {otherRoles.length > 0 && (
        <SectionCard>
          <div className="flex items-start gap-3">
            <Repeat size={16} className="text-zinc-500 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm text-zinc-400">
                This account is also authorized for {otherRoles.join(", ")}.
              </p>
              <div className="flex flex-wrap gap-2">
                {otherRoles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    disabled={switching}
                    onClick={() => handleSwitch(r)}
                    className="text-xs font-medium px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition disabled:opacity-50"
                  >
                    Switch to {r === "student" ? "Student" : r === "tpo" ? "TPO" : "Recruiter"}
                  </button>
                ))}
              </div>
              {switchError && <p className="text-xs text-red-400">{switchError}</p>}
            </div>
          </div>
        </SectionCard>
      )}

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <Link to={meta.dashboardPath} className="text-white font-medium hover:underline">
          {meta.dashboardLabel} →
        </Link>
        <Link to="/settings" className="text-zinc-400 hover:text-white transition">
          Account settings →
        </Link>
      </div>
    </div>
  );
}
