import PageMeta from "../../components/seo/PageMeta";
import UsersLoginAsSection from "../../components/admin/UsersLoginAsSection";
import { useAdminUsers } from "../../hooks/useAdminUsers";

// Plan 001, migration decision (a): the "Users / Login As" table extracted
// out of the old monolithic AdminConsolePage.jsx into its own page, mounted
// at /admin/users so the nav item matches its label. Moved verbatim (via
// the already-extracted section component/hook), no behavior change.
// Plan 003 (user management actions) extends this page next.
export default function AdminUsersPage() {
  const adminUsers = useAdminUsers();

  return (
    <>
      <PageMeta title="Users — Admin Console — Code Club" description="Search users and log in as any account." />
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">Users</h1>
          <p className="text-zinc-500 text-sm">Search, filter, and log in as any account.</p>
        </div>

        <UsersLoginAsSection adminUsers={adminUsers} />
      </div>
    </>
  );
}