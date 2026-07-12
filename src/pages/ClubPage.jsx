import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";

// ── Club hub ──────────────────────────────────────────────────────────────
// Consolidates the community-facing surfaces that used to live as separate
// top-level nav items (Leaderboard, Contests, Ambassador) into one place.
// Each card links straight through to the existing, fully-built page —
// no logic was duplicated or rewritten, only the entry point moved.

const CLUB_SECTIONS = [
    {
        id: "leaderboard",
        to: "/leaderboard",
        icon: "🏆",
        title: "Leaderboard",
        description: "See where you rank against every other coder in Code Club.",
        cta: "View Leaderboard",
    },
    {
        id: "contests",
        to: "/contests",
        icon: "⚔️",
        title: "Contests",
        description: "Compete live, race the clock, and climb the standings.",
        cta: "Browse Contests",
    },
    {
        id: "ambassador",
        to: "/ambassador",
        icon: "🎓",
        title: "Ambassador Program",
        description: "Bring Code Club to your campus and earn rewards for it.",
        cta: "Learn More",
    },
];

function ClubPage() {
    return (
        <DashboardLayout>
            <div className="max-w-5xl space-y-8">
                <div>
                    <h1 className="text-4xl font-bold">Club</h1>
                    <p className="text-zinc-400 mt-2">
                        Where the Code Club community competes, connects, and grows.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-5">
                    {CLUB_SECTIONS.map((section) => (
                        <Link
                            key={section.id}
                            to={section.to}
                            className="
                                group bg-zinc-900 border border-zinc-800 rounded-2xl p-6
                                flex flex-col
                                transition-all duration-200
                                hover:-translate-y-1 hover:border-green-500/50
                                hover:shadow-lg hover:shadow-green-500/5
                            "
                        >
                            <div className="text-4xl mb-4">{section.icon}</div>

                            <h2 className="text-xl font-semibold mb-2">
                                {section.title}
                            </h2>

                            <p className="text-zinc-400 text-sm flex-1">
                                {section.description}
                            </p>

                            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-green-400 group-hover:gap-2.5 transition-all">
                                {section.cta}
                                <span aria-hidden="true">→</span>
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}

export default ClubPage;