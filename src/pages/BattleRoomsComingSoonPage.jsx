import DashboardLayout from "../layouts/DashboardLayout";
import ClubSubNav from "../components/club/ClubSubNav";
import SectionCard from "../components/ui/layout/SectionCard";
import { Users } from "lucide-react";

/**
 * BattleRoomsComingSoonPage — placeholder shown at /club/battle-rooms and
 * /club/battle-rooms/:id while the feature is disabled.
 *
 * Backend-readiness decision (Battle Rooms & Editorial Production Decision):
 * Battle Rooms is NOT production ready. `backend/routes/battleRooms.js`
 * exists but is intentionally left unmounted in `backend/server.js` — the
 * scoring loop is broken end-to-end (the frontend never calls
 * POST /:id/solve, and that endpoint trusts a bare client-sent `slug` with
 * no server-side proof of an Accepted submission, unlike the audited
 * Contest scoring path in services/contestScoring.js). There's also no
 * leave/cancel route, so a student who joins — or a host who abandons a
 * lobby — has no way out.
 *
 * The original interactive pages (BattleRoomsPage.jsx,
 * BattleRoomDetailPage.jsx, HostBattleRoomForm.jsx) are left in place,
 * unused, as a starting point for whenever that work is scoped — they
 * should not be wired back up to real routes until the solve-verification
 * gap is closed and the frontend actually reads the `battleRoom` query
 * param it already writes into the problem-page link.
 */
export default function BattleRoomsComingSoonPage() {
  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <ClubSubNav />

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Battle Rooms</h1>
          <p className="text-[var(--muted-foreground)] mt-2">
            Team up, split the problem set, and race another team to the finish.
          </p>
        </div>

        <SectionCard
          title="Coming Soon"
          subtitle="We're still polishing this one"
          icon={<Users size={18} strokeWidth={2} />}
          accented
        >
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-[var(--surface-elevated)] text-[var(--muted-foreground)] flex items-center justify-center mx-auto mb-4">
              <Users size={26} strokeWidth={2} aria-hidden="true" />
            </div>
            <p className="text-[var(--foreground)] font-medium mb-1">Battle Rooms isn't open yet</p>
            <p className="text-[var(--muted-foreground)] text-sm max-w-sm mx-auto">
              Team-vs-team matches are still being finished up behind the scenes.
              Check back soon — in the meantime, Private Contests and the
              Leaderboard are ready to go.
            </p>
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}