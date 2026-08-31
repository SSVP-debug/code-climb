import { z } from "zod";

/**
 * schemas/rewardStoreSchema.js — request-body validation for Rewards
 * Store (Phase 4) routes. Same reuse style as contributionSchema.js/
 * opportunitySchema.js.
 *
 * ShippingAddressSchema deliberately does NOT enforce "required iff the
 * item requires shipping" at the schema level — that cross-entity check
 * (the requirement lives on RewardCatalogItem, not on the request body
 * itself) is exactly the kind of shape rule
 * services/rewardStore.js's requestRedemption() already validates at the
 * service boundary (see RewardRedemption.js's header comment for why).
 * This schema only validates "IF an address is given, is it well-formed"
 * — the service layer decides whether one was required at all.
 */

const ShippingAddressSchema = z.object({
  recipientName: z.string().trim().min(1, "recipientName is required").max(200),
  line1: z.string().trim().min(1, "line1 is required").max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1, "city is required").max(100),
  state: z.string().trim().min(1, "state is required").max(100),
  postalCode: z.string().trim().min(1, "postalCode is required").max(20),
  country: z.string().trim().min(1, "country is required").max(100),
});

export const CatalogItemCreateSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(120),
  description: z.string().trim().min(1, "description is required").max(2000),
  costCredits: z.coerce.number().int().min(1, "costCredits must be at least 1"),
  category: z.string().trim().max(100).nullable().optional(),
  requiresShipping: z.boolean().optional().default(false),
  stock: z.coerce.number().int().min(0).nullable().optional(),
  imageUrl: z.string().trim().url().max(2000).nullable().optional(),
});

// Same fields as create, all optional — a partial update. `active` is
// only settable here, not on create: a brand-new catalog item is always
// active by default (matches the model's own default), and the whole
// point of PATCH is toggling fields like this one after the fact.
export const CatalogItemUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().min(1).max(2000).optional(),
  costCredits: z.coerce.number().int().min(1).optional(),
  category: z.string().trim().max(100).nullable().optional(),
  requiresShipping: z.boolean().optional(),
  stock: z.coerce.number().int().min(0).nullable().optional(),
  imageUrl: z.string().trim().url().max(2000).nullable().optional(),
  active: z.boolean().optional(),
});

export const RedemptionRequestSchema = z.object({
  itemId: z.string().trim().min(1, "itemId is required"),
  shippingAddress: ShippingAddressSchema.optional(),
});

export const RedemptionRejectSchema = z.object({
  reason: z.string().trim().max(1000).nullable().optional().default(null),
});

export const RedemptionFulfillSchema = z.object({
  adminNotes: z.string().trim().max(2000).nullable().optional().default(null),
});