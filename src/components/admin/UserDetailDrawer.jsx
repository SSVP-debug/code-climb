import Button from "../ui/Button";
import UserActionsMenu from "./UserActionsMenu";
import SideDrawer, { DrawerSection, DrawerField } from "./command/SideDrawer";

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const ROLE_LABEL = { student: "Student", recruiter: "Recruiter", tpo: "TPO" };

/**
 * UserDetailDrawer — Command Center Phase 4 ask ("USER INTELLIGENCE...
 * clicking a user should open a sophisticated side drawer").
 *
 * Honest scope note: GET /api/admin/users only ever returns
 * { id, displayName, email, username, role, status, label, verified,
 * joinedAt } (see adminController.js's listUsers) — no last-active
 * timestamp, no coding-activity stats (problems solved, submissions,
 * streak), no college name for students. The spec draft mentioned a
 * "Coding Activity" panel; it's deliberately left out here rather than
 * invented, since building it honestly would mean either a new admin
 * endpoint reading Submission directly, or reusing the public-profile
 * endpoint (which 403s for private profiles and would silently break the
 * drawer for those users). Everything below maps to a real field.
 */
export default function UserDetailDrawer({ user, open, onClose, actions }) {
  if (!user) return <SideDrawer open={open} onClose={onClose} title="" />;

  const { impersonatingId, loginAs, busyIds, suspendUser, activateUser, deleteUser, resetUserProgress, changeUserRole } =
    actions;

  return (
    <SideDrawer open={open} onClose={onClose} eyebrow={ROLE_LABEL[user.role] || user.role} title={user.displayName || user.email}>
      <DrawerSection label="Status">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              user.status === "suspended"
                ? "bg-verdict-reject/10 text-verdict-reject"
                : "bg-verdict-accept/10 text-verdict-accept"
            }`}
          >
            {user.status === "suspended" ? "Suspended" : "Active"}
          </span>
          {(user.role === "recruiter" || user.role === "tpo") && (
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                user.verified ? "bg-verdict-accept/10 text-verdict-accept" : "bg-verdict-pending/10 text-verdict-pending"
              }`}
            >
              {user.verified ? "Verified" : "Verification pending"}
            </span>
          )}
        </div>
      </DrawerSection>

      <DrawerSection label="Identity">
        <DrawerField label="Username" value={user.username ? `@${user.username}` : null} />
        <DrawerField label="Email" value={user.email} copyable />
        {user.label && (
          <DrawerField label={user.role === "recruiter" ? "Company" : "College"} value={user.label} />
        )}
      </DrawerSection>

      <DrawerSection label="Account">
        <DrawerField label="Role" value={ROLE_LABEL[user.role] || user.role} />
        <DrawerField label="Joined" value={formatDate(user.joinedAt)} />
      </DrawerSection>

      <DrawerSection label="Actions">
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="w-full justify-center"
            disabled={impersonatingId === user.id}
            loading={impersonatingId === user.id}
            onClick={() => loginAs(user)}
          >
            Login as {user.displayName || "user"}
          </Button>
          <div className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2">
            <span className="text-zinc-400 text-xs">More actions</span>
            <UserActionsMenu
              user={user}
              busy={busyIds[user.id]}
              onSuspend={suspendUser}
              onActivate={activateUser}
              onDelete={deleteUser}
              onResetProgress={resetUserProgress}
              onChangeRole={changeUserRole}
            />
          </div>
        </div>
      </DrawerSection>
    </SideDrawer>
  );
}
