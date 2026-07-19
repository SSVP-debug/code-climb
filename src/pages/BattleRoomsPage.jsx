import DashboardLayout from "../layouts/DashboardLayout";
import ClubSubNav from "../components/club/ClubSubNav";
import SectionCard from "../components/ui/layout/SectionCard";
import { Users, RadioTower, Timer, BarChart3 } from "lucide-react";

const V1_FEATURES = [
  { icon: Users, label: "Team vs. team", desc: "Assign problems to teammates and race another team to the finish." },
  { icon: Timer, label: "Live-ish scoreboard", desc: "Scores, timer, and submissions refresh automatically while the room is open." },
  { icon: BarChart3, label: "Room analytics", desc: "Full team and individual breakdown once the match ends." },
];

/**
 * BattleRoomsPage — coming-soon placeholder (Phase 12E, not yet built).
 * Exists as a real route (not a dead nav-tab link) and describes the
 * *confirmed* v1 scope from the Phase 12 plan rather than vague marketing
 * copy, so it doesn't over-promise features (WebSockets, spectator mode,
 * team chat) that are explicitly later upgrades, not v1.
 */
function BattleRoomsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <ClubSubNav />

        <SectionCard
          title="Battle Rooms"
          subtitle="Real-time team competitions — coming to Code Club"
          icon={<RadioTower size={18} strokeWidth={2} />}
          accented
        >
          <p className="text-zinc-400 mb-6">
            Battle Rooms will let you form a team, split up problems, and go
            head-to-head with another team in a live match. Here's what the
            first version will include:
          </p>

          <div className="space-y-3">
            {V1_FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 bg-zinc-800/60 rounded-xl p-4">
                <Icon size={18} className="text-zinc-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-sm text-zinc-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-zinc-600 text-xs mt-6">
            Battle Rooms build directly on the existing contest engine — same
            problem library, submission pipeline, and leaderboard logic you
            already use in Public and Private Contests.
          </p>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}

export default BattleRoomsPage;