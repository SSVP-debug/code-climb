/**
 * auditLogFormat.js — shared formatting for AdminAuditLog entries, used by
 * both the Overview page's Platform Activity timeline and the Audit Logs
 * page's timeline. One source of truth for the action-string vocabulary
 * so the two views can't drift apart.
 *
 * The action strings themselves come directly from the real call sites
 * (grep "action:" across backend/controllers/*.js) — this only maps
 * known strings to a human label; an action string that isn't in this
 * map still renders (raw, unmodified) rather than disappearing, so a
 * future admin action added on the backend never silently breaks this UI.
 */
const VERB_LABELS = {
  approve: "Approved",
  reject: "Rejected",
  suspend: "Suspended",
  activate: "Reactivated",
  delete: "Deleted",
  update: "Updated",
  update_safelisted: "Updated (safelisted fields on)",
  change_role: "Changed role for",
  reset_progress: "Reset progress for",
};

const SUBJECT_LABELS = {
  recruiter: "a recruiter",
  tpo: "a TPO/college request",
  studentCollege: "a student college request",
  user: "a user",
  problem: "a problem",
  settings: "settings",
};

// JARVIS pass, spec §13: "make the timeline visually communicate WHO/WHAT/
// TARGET/WHEN... resemble an operational/security event stream." Tone is
// derived from the same real verb vocabulary above, not a separate guess —
// so an unrecognized future verb still falls through to "neutral" rather
// than mis-coloring itself as safe or dangerous.
const VERB_TONE = {
  approve: "positive",
  activate: "positive",
  reject: "destructive",
  suspend: "destructive",
  delete: "destructive",
  reset_progress: "destructive",
  update: "neutral",
  update_safelisted: "neutral",
  change_role: "neutral",
};

export function getAuditActionTone(action) {
  if (!action) return "neutral";
  const verb = action.split(".").slice(1).join(".");
  return VERB_TONE[verb] || "neutral";
}

export function formatAuditAction(action) {
  if (!action) return "Admin action";
  const [subject, ...verbParts] = action.split(".");
  const verb = verbParts.join(".");
  if (!verb) return action;
  const verbLabel = VERB_LABELS[verb] || verb;
  const subjectLabel = SUBJECT_LABELS[subject] || subject;
  return `${verbLabel} ${subjectLabel}`;
}

export function formatAuditTarget(log) {
  if (!log.targetType) return null;
  return log.targetId ? `${log.targetType} · ${log.targetId}` : log.targetType;
}
