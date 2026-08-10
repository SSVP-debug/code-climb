import PageMeta from "../../components/seo/PageMeta";
import DashboardMetricsSection from "../../components/admin/DashboardMetricsSection";
import ViewAsSection from "../../components/admin/ViewAsSection";
import DemoDatasetSection from "../../components/admin/DemoDatasetSection";
import VerificationQueueSection, { formatDate } from "../../components/admin/VerificationQueueSection";
import CommandCenterHero from "../../components/admin/command/CommandCenterHero";
import { useAdminVerificationQueue } from "../../hooks/useAdminVerificationQueue";

// Plan 001, migration decision (a): AdminConsolePage.jsx split so the
// "Users" nav item maps to a page that matches its label (AdminUsersPage).
// Everything else — View As, demo dataset, the three verification
// queues — stays here, mounted at the /admin index route. Moved verbatim
// (via the already-extracted section components/hook), no behavior change.
//
// Plan 004: the operational-metrics stat-card grid is prepended here too,
// rather than as a separate page/route. This IS the "Dashboard" nav item
// (see AdminLayout.jsx's NAV_ITEMS) already before plan 004 landed, and the
// pending-approval cards it adds are meant to quick-link straight to the
// verification queues below — since both live on the same page, that's a
// same-page anchor scroll (#recruiter-queue / #tpo-queue), not a route.
export default function AdminOverviewPage() {
  const {
    loading,
    recruiters,
    tpos,
    studentCollegeRequests,
    busyIds,
    pendingCount,
    actOnRecruiter,
    actOnTpo,
    actOnStudentCollege,
  } = useAdminVerificationQueue();

  return (
    <>
      <PageMeta title="Command Center — Code Club Admin" description="Live operational overview, verification queue, and role preview." />
      <div className="max-w-5xl mx-auto">
        <CommandCenterHero pendingCount={pendingCount} />

        <DashboardMetricsSection />

        <ViewAsSection />
        <DemoDatasetSection />

        <div id="recruiter-queue">
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
        </div>

        <div id="tpo-queue">
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

        <VerificationQueueSection
          heading="College requests from students"
          loading={loading}
          emptyLabel="No student college requests awaiting review."
          items={studentCollegeRequests}
          busyIds={busyIds}
          getRow={(c) => ({
            id: c.collegeId,
            title: c.collegeName,
            subtitle: c.requestedBy?.displayName || c.requestedBy?.email || "Unknown requester",
            meta: `${(c.domains || []).join(", ")}${c.website ? " · " + c.website : ""} · requested ${formatDate(c.requestedAt)}`,
          })}
          onApprove={(id) => actOnStudentCollege(id, "approve")}
          onReject={(id) => actOnStudentCollege(id, "reject")}
        />
      </div>
    </>
  );
}