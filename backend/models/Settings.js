import mongoose from "mongoose";

/**
 * Settings — single-document runtime config store (plan 009).
 *
 * Scope decision (see admin-console-plans/plans/009-settings-feature-flags.md):
 * this deliberately does NOT migrate MONETIZATION_ENABLED/B2B_ENABLED
 * (backend/config/featureFlags.js) to runtime-toggleable settings. Step 1's
 * grep (`MONETIZATION_ENABLED\|B2B_ENABLED` across backend/ and src/) found
 * 8 real call sites outside test/env files (config/ambassadorMilestones.js,
 * middleware/premiumGate.js, server.js, routes/tpo.js, routes/billing.js,
 * routes/hints.js, src/config/featureFlags.js, src/context/PremiumContext.jsx)
 * — well above the plan's "under 5" bar for cheaply switching to the
 * full-migration option. Those two flags stay exactly as they are: env-var,
 * static, read once at boot. This model only covers settings that don't
 * already have a static-flag equivalent.
 *
 * Single-document pattern: every read/write goes through the fixed
 * `key: "global"` document (unique index below), upserted on first access
 * by settingsService.js — so there's never ambiguity about which document
 * is "current," and no risk of a second document ever being created by
 * accident.
 */
const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "global",
      unique: true,
      immutable: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    // Default true on both — an unconfigured settings document must never
    // silently lock out new recruiter/TPO signups the moment this model
    // is introduced.
    recruiterRegistrationEnabled: {
      type: Boolean,
      default: true,
    },
    tpoRegistrationEnabled: {
      type: Boolean,
      default: true,
    },
    announcement: {
      text: { type: String, default: "", trim: true, maxlength: 500 },
      active: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", settingsSchema);