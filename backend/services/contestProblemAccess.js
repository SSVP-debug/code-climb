import Contest from "../models/Contest.js";

// ── Contest problem access ──────────────────────────────────────────────────
// Fest Readiness Audit, P0-2: a Problem tagged `visibility: "contest"` (see
// models/Problem.js) must not be readable or executable outside the contest
// window it belongs to. This is the single shared gate used everywhere a
// Problem document might otherwise be handed to a caller who isn't entitled
// to it yet — see controllers/problemController.js (detail endpoint),
// controllers/judgeController.js (Run/Submit), routes/editorial.js, and
// routes/hints.js.
//
// A Problem doesn't carry its own contest reference (Contest.problemSlugs
// is the only link — a slug could, in principle, belong to more than one
// contest over its lifetime), so this looks up every contest currently
// referencing the slug and grants access if ANY of them currently justifies
// it, rather than adding a second, redundant Problem→Contest field.
//
// Policy (documented explicitly, per the audit's instruction not to make
// this decision by accident): once a contest referencing this problem has
// ENDED, the problem opens up to everyone — this matches the fest's own
// stated scenario ("participants may explore the rest of the platform
// after... the contest"). An upcoming or currently-active contest, by
// contrast, only grants access to that contest's own organizer (at any
// time — they need to be able to review what they configured) or its own
// joined participants, and only once the contest is actually ACTIVE, never
// while it's still upcoming.
export async function canAccessContestProblem(slug, userDoc) {
  const contests = await Contest.find({ problemSlugs: slug })
    .select("startsAt endsAt createdBy participants.userId")
    .lean();

  // A "contest" visibility problem with no contest currently referencing it
  // at all is an orphaned/misconfigured state (e.g. removed from every
  // contest after being tagged, or seeded but never attached). Fail closed
  // rather than silently exposing it — an operator can always flip
  // `visibility` back to "public" once it's genuinely meant to be.
  if (contests.length === 0) {
    return false;
  }

  const userId = userDoc?._id?.toString() ?? null;
  const now = new Date();

  for (const contest of contests) {
    const status =
      now < new Date(contest.startsAt) ? "upcoming"
      : now > new Date(contest.endsAt) ? "ended"
      : "active";

    if (status === "ended") return true;

    // Anonymous callers can never satisfy the remaining (organizer /
    // active-participant) checks — an upcoming/active contest problem is
    // never public to a logged-out visitor.
    if (!userId) continue;

    if (contest.createdBy?.toString() === userId) return true;

    if (status === "active") {
      const isParticipant = contest.participants?.some(
        (p) => p.userId?.toString() === userId
      );
      if (isParticipant) return true;
    }
  }

  return false;
}
