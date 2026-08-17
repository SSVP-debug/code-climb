import { useState } from "react";
import Button from "../ui/Button";
import ConfirmDialog from "../ui/ConfirmDialog";

/**
 * LoginAsButton — the single entry point into impersonation.
 *
 * Admin UX audit (Phase UI-3, P0): impersonation was previously a single
 * click with no confirmation, from two separate call sites (the Users
 * table row and UserDetailDrawer). One accidental click on a densely
 * packed row instantly puts the admin into another person's account. The
 * spec is explicit that impersonation "deserves special attention" and
 * must never be a one-click surprise — so this is now a shared component
 * both call sites use, instead of two copies of a confirm flow drifting
 * apart over time.
 *
 * Full-page reload on confirm (inside loginAs itself) is unchanged; this
 * component only adds the "are you sure" step in front of it.
 */
export default function LoginAsButton({ user, impersonatingId, loginAs, className, label }) {
  const [confirming, setConfirming] = useState(false);
  const busy = impersonatingId === user.id;

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        className={className}
        disabled={busy}
        loading={busy}
        onClick={() => setConfirming(true)}
      >
        {label || "Login As"}
      </Button>

      {confirming && (
        <ConfirmDialog
          title={`Log in as ${user.displayName || user.email}?`}
          description={`You'll immediately start acting as this user across the whole platform — their dashboard, their data, their permissions. This is logged. Use "Exit Impersonation" in the banner at the top of the screen to return to your own account.`}
          confirmLabel="Login As"
          onConfirm={() => {
            setConfirming(false);
            loginAs(user);
          }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}