import { z } from "zod";

/**
 * schemas/contributionSchema.js — request-body validation for Contribution
 * Infrastructure (Phase 2F) routes, same reuse style as
 * opportunitySchema.js/problemSchema.js.
 *
 * `kind` stays a free string here, not a closed z.enum — see
 * models/Contribution.js's header for why: no product decision exists
 * yet for the closed set of contribution types, so this schema doesn't
 * invent one either. It's still bounded (non-empty, reasonable max
 * length) so a malformed or absurdly long value can't slip through.
 *
 * `payload` stays z.record(z.any()) for the same reason — the shape is
 * whatever the (not-yet-decided) kind needs. This schema's job is only
 * "is this a plausible JSON object," not "is this a valid new_problem
 * draft" — that kind-specific validation is future, out-of-scope work
 * once a first kind is actually decided.
 */

export const ContributionCreateSchema = z.object({
  kind: z.string().trim().min(1, "kind is required").max(80),
  payload: z.record(z.any()).default({}),
});

export const ContributionRejectSchema = z.object({
  reason: z.string().trim().max(1000).nullable().optional().default(null),
});

export const ContributionRetrySchema = z.object({
  limit: z.coerce.number().int().positive().max(1000).optional(),
});