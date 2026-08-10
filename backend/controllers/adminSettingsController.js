/**
 * adminSettingsController.js (plan 009)
 *
 * getSettingsAdmin/updateSettingsAdmin are requireAdmin-gated (full
 * document + the two read-only env-var flags for context). getAnnouncement
 * is mounted separately as a PUBLIC route in server.js (no auth) — it
 * intentionally returns ONLY { text, active }, nothing else from the
 * settings document, per the plan's explicit requirement.
 */
import { getSettings, updateSettings } from "../services/settingsService.js";
import { recordAdminAction } from "../services/adminAuditLog.js";
import { MONETIZATION_ENABLED, B2B_ENABLED } from "../config/featureFlags.js";
import { logger } from "../config/logger.js";

// Only these top-level fields are writable via the admin endpoint —
// MONETIZATION_ENABLED/B2B_ENABLED are intentionally absent (see
// models/Settings.js's header for the scope decision) and `key`/timestamps
// are Mongoose-managed, never client-writable.
const WRITABLE_FIELDS = [
  "maintenanceMode",
  "recruiterRegistrationEnabled",
  "tpoRegistrationEnabled",
  "announcement",
];

function pickWritable(body) {
  const partial = {};
  for (const field of WRITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) partial[field] = body[field];
  }
  return partial;
}

// ── GET /api/admin/settings ─────────────────────────────────────────────────
export async function getSettingsAdmin(req, res) {
  try {
    const settings = await getSettings();
    return res.json({
      ...settings,
      // Shown for context/parity in the admin UI, but not part of this
      // document and not writable through this endpoint — see the plan's
      // scope decision. Changing either requires an env var + redeploy.
      envFlags: {
        monetizationEnabled: MONETIZATION_ENABLED,
        b2bEnabled: B2B_ENABLED,
        readOnly: true,
        note: "Set via environment variable — changing requires a redeploy, not this page.",
      },
    });
  } catch (err) {
    logger.error({ err }, "[Admin] getSettingsAdmin error");
    return res.status(500).json({ error: "Failed to load settings." });
  }
}

// ── PATCH /api/admin/settings ───────────────────────────────────────────────
export async function updateSettingsAdmin(req, res) {
  try {
    const partial = pickWritable(req.body || {});
    if (Object.keys(partial).length === 0) {
      return res.status(400).json({ error: "No recognized settings fields in the request body." });
    }

    const before = await getSettings();
    const after = await updateSettings(partial);

    // details captures before/after only for the fields actually touched
    // in this request — not a full document diff, so the audit log entry
    // stays readable even as more settings fields get added later.
    const changed = {};
    for (const field of Object.keys(partial)) {
      changed[field] = { before: before[field], after: after[field] };
    }

    recordAdminAction({
      adminDoc: req.actingAdminDoc || req.userDoc,
      action: "settings.update",
      targetType: "Settings",
      targetId: after._id,
      details: changed,
    });

    return res.json({
      ...after,
      envFlags: {
        monetizationEnabled: MONETIZATION_ENABLED,
        b2bEnabled: B2B_ENABLED,
        readOnly: true,
        note: "Set via environment variable — changing requires a redeploy, not this page.",
      },
    });
  } catch (err) {
    logger.error({ err }, "[Admin] updateSettingsAdmin error");
    return res.status(500).json({ error: "Failed to update settings." });
  }
}

// ── GET /api/announcement — PUBLIC, no auth ─────────────────────────────────
// Mounted outside /api/admin entirely (see server.js) so logged-out
// visitors can see it too. Returns ONLY the announcement sub-document —
// never maintenanceMode/registration toggles, which aren't this
// endpoint's business to expose publicly.
export async function getAnnouncement(req, res) {
  try {
    const settings = await getSettings();
    return res.json({
      text: settings.announcement?.text || "",
      active: settings.announcement?.active || false,
    });
  } catch (err) {
    logger.error({ err }, "[Public] getAnnouncement error");
    // Fail closed to "no announcement" rather than a 500 on a public,
    // unauthenticated, purely-cosmetic endpoint the whole app calls on
    // every page load.
    return res.json({ text: "", active: false });
  }
}