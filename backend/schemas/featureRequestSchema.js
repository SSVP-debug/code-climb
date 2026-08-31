import { z } from "zod";

/**
 * schemas/featureRequestSchema.js — request-body validation for Feature
 * Requests (Phase 5) routes, same reuse style as contributionSchema.js /
 * opportunitySchema.js.
 */

export const FeatureRequestCreateSchema = z.object({
  title: z.string().trim().min(1, "title is required").max(200),
  description: z.string().trim().min(1, "description is required").max(5000),
});

// PATCH is a partial update — either field alone is valid, but an empty
// body isn't (services/featureRequests.js's editFeatureRequest() already
// rejects that itself, but failing fast here avoids the extra round trip
// to the atomic ownership+status-guarded query for a request that can
// never succeed).
export const FeatureRequestUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().min(1).max(5000).optional(),
  })
  .refine((data) => data.title !== undefined || data.description !== undefined, {
    message: "At least one of title or description is required.",
  });

// Deliberately NOT the full FeatureRequest.status enum. "open" is only
// ever the create-time default (never something to transition *back*
// to), and "withdrawn" is self-service-only (services/featureRequests.js's
// withdrawFeatureRequest(), reachable only by the request's own
// submitter, not this admin-facing endpoint) — matches
// models/FeatureRequest.js's own header comment distinguishing who can
// reach which terminal state.
export const FeatureRequestStatusUpdateSchema = z.object({
  status: z.enum(["planned", "in_progress", "shipped", "declined"]),
});

export const FeatureRequestRetrySchema = z.object({
  limit: z.coerce.number().int().positive().max(1000).optional(),
});