/**
 * AdminConsolePage — verification queue, user impersonation ("Login As"),
 * and role-preview shortcuts for admins.
 *
 * This file used to be 434 lines with all of that state and every section
 * inlined together (Staff review §4/§9/#12). It's now composition:
 *   - useAdminVerificationQueue → recruiter/TPO pending requests + actions
 *   - useAdminUsers            → paginated user list + Login As
 *   - components/admin/*        → the five presentational sections
 */
import PageMeta from "../components/seo/PageMeta";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAdminVerificationQueue } from "../hooks/useAdminVerificationQueue";
import { useAdminUsers } from "../hooks/useAdminUsers";
import ViewAsSection from "../components/admin/ViewAsSection";
import DemoDatasetSection from "../components/admin/DemoDatasetSection";
import UsersLoginAsSection from "../components/admin/UsersLoginAsSection";
import VerificationQueueSection, { formatDate } from "../components/admin/VerificationQueueSection";

export default function AdminConsolePage() {
  const queue = useAdminVerificationQueue();
  const adminUsers = useAdminUsers();
  const { loading, recruiters, tpos, busyIds, pendingCount, actOnRecruiter, actOnTpo } = queue;

  return (
    <>
      <PageMeta title="Admin Console — Code Club" description="Verification queue and role preview." />
      <DashboardLayout>
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-white">Admin Console</h1>
            <p className="text-zinc-500 text-sm">
              {pendingCount > 0
                ? `${pendingCount} request${pendingCount === 1 ? "" : "s"} awaiting review`
                : "Nothing waiting on you right now."}
            </p>
          </div>

          <ViewAsSection />
          <DemoDatasetSection />
          <UsersLoginAsSection adminUsers={adminUsers} />

          <VerificationQueueSection
            heading="Recruiter requests"
            loading={loading}
            emptyLabel="No recruiters awaiting review."
            items={recruiters}
            busyIds={busyIds}
            getRow={(r) => ({
              id: r.id,
              title: r.companyName || r.email,
              subtitle: `${r.displayName || r.email} · ${r.designation || "—"}`,
              meta: `${r.companyDomain} · requested ${formatDate(r.requestedAt)}`,
            })}
            onApprove={(id) => actOnRecruiter(id, "approve")}
            onReject={(id) => actOnRecruiter(id, "reject")}
          />

          <VerificationQueueSection
            heading="TPO / college requests"
            loading={loading}
            emptyLabel="No colleges awaiting review."
            items={tpos}
            busyIds={busyIds}
            getRow={(t) => ({
              id: t.collegeId,
              title: t.collegeName,
              subtitle: t.requestedBy?.displayName || t.requestedBy?.email || "Unknown requester",
              meta: `${t.domain} · requested ${formatDate(t.requestedAt)}`,
            })}
            onApprove={(id) => actOnTpo(id, "approve")}
            onReject={(id) => actOnTpo(id, "reject")}
          />
        </div>
      </DashboardLayout>
    </>
  );
}
