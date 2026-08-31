import {
  createFeatureRequest,
  listFeatureRequests,
  getMyFeatureRequests,
  toggleVote,
  editFeatureRequest,
  withdrawFeatureRequest,
  getVotedRequestIds,
} from "../services/featureRequests.js";

/**
 * controllers/featureRequestController.js — self-service endpoints for
 * Feature Requests (Phase 5). Open to any authenticated role (student,
 * recruiter, TPO — not student-only, unlike Contribution/Credits), per
 * Bunny's own scoping decision — no role gate in any handler here beyond
 * the requireAuth already applied at the router-mount level in
 * server.js. Admin-facing status-management endpoints live in
 * controllers/adminFeatureRequestController.js + routes/admin.js, same
 * split contributionController.js / adminContributionController.js
 * already established.
 */

// ── POST /api/feature-requests ──────────────────────────────────────────────
// Body already validated by validateBody(FeatureRequestCreateSchema)
// (routes/featureRequests.js) before this handler runs.
export async function submitFeatureRequest(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const { title, description } = req.body;
    const featureRequest = await createFeatureRequest({
      submittedBy: req.userDoc._id,
      title,
      description,
    });

    return res.status(201).json({ featureRequest });
  } catch (err) {
    req.log.error({ err }, "[FeatureRequest] submitFeatureRequest failed");
    return res.status(500).json({ error: "Failed to submit feature request." });
  }
}

// ── GET /api/feature-requests?status=&sort=&page=&limit= ───────────────────
// The public board. Hydrates each entry's `hasVoted` for the requesting
// user in one extra query (getVotedRequestIds()) rather than N — the
// N+1 a naive per-row lookup would otherwise cost on a page of 20 items.
export async function listFeatureRequestsPublic(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const { status, sort } = req.query;
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 20, 100);

    const { entries, total } = await listFeatureRequests({ status, sort, page, limit });
    const votedIds = await getVotedRequestIds(
      req.userDoc._id,
      entries.map((entry) => entry._id)
    );

    const featureRequests = entries.map((entry) => ({
      ...entry.toObject(),
      hasVoted: votedIds.has(String(entry._id)),
    }));

    return res.json({ featureRequests, page, limit, total });
  } catch (err) {
    req.log.error({ err }, "[FeatureRequest] listFeatureRequestsPublic failed");
    return res.status(500).json({ error: "Failed to load feature requests." });
  }
}

// ── GET /api/feature-requests/mine ──────────────────────────────────────────
// Always scoped to req.userDoc — never accepts a submittedBy query param,
// same reasoning routes/rewards.js's getMyLedger and
// contributionController.js's getMyContributions both already use.
// Unlike the public board, this includes "withdrawn" rows — a submitter
// should still see their own withdrawal in their own history.
export async function getMyFeatureRequestsController(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 20, 100);

    const { entries, total } = await getMyFeatureRequests({
      submittedBy: req.userDoc._id,
      page,
      limit,
    });

    return res.json({ featureRequests: entries, page, limit, total });
  } catch (err) {
    req.log.error({ err }, "[FeatureRequest] getMyFeatureRequestsController failed");
    return res.status(500).json({ error: "Failed to load your feature requests." });
  }
}

// ── POST /api/feature-requests/:id/vote ─────────────────────────────────────
// A toggle, not a one-way action — see services/featureRequests.js's
// toggleVote() for the race-safety design. { voted: true } means the
// caller now has a vote on this request; { voted: false } means they
// just removed theirs.
export async function voteFeatureRequestController(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const result = await toggleVote({
      featureRequestId: req.params.id,
      userId: req.userDoc._id,
    });

    return res.json(result);
  } catch (err) {
    req.log.error({ err }, "[FeatureRequest] voteFeatureRequestController failed");
    return res.status(500).json({ error: "Failed to record vote." });
  }
}

// ── PATCH /api/feature-requests/:id ─────────────────────────────────────────
// Body already validated by validateBody(FeatureRequestUpdateSchema)
// (routes/featureRequests.js). Ownership + "status must still be open"
// are both enforced atomically inside editFeatureRequest() itself, not
// re-checked here — a 409 covers "not found", "not yours", and "no
// longer open" alike, deliberately not distinguished further (the same
// posture approveContributionAdmin's 409 already takes for its own
// not-found-or-not-pending case, so a caller can't use this response to
// probe whether a given :id exists at all if it isn't theirs).
export async function editFeatureRequestController(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const { title, description } = req.body;
    const result = await editFeatureRequest({
      featureRequestId: req.params.id,
      requesterId: req.userDoc._id,
      title,
      description,
    });

    if (!result.updated) {
      return res.status(409).json({
        error: "Feature request not found, not yours, or no longer editable.",
        reason: result.reason,
      });
    }

    return res.json(result);
  } catch (err) {
    req.log.error({ err }, "[FeatureRequest] editFeatureRequestController failed");
    return res.status(500).json({ error: "Failed to update feature request." });
  }
}

// ── POST /api/feature-requests/:id/withdraw ─────────────────────────────────
// Same ownership+status-guard posture as edit above.
export async function withdrawFeatureRequestController(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const result = await withdrawFeatureRequest({
      featureRequestId: req.params.id,
      requesterId: req.userDoc._id,
    });

    if (!result.withdrawn) {
      return res.status(409).json({
        error: "Feature request not found, not yours, or no longer withdrawable.",
        reason: result.reason,
      });
    }

    return res.json(result);
  } catch (err) {
    req.log.error({ err }, "[FeatureRequest] withdrawFeatureRequestController failed");
    return res.status(500).json({ error: "Failed to withdraw feature request." });
  }
}