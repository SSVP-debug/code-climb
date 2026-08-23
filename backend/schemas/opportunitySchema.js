import { z } from "zod";

/**
 * opportunitySchema.js — request-body validation for Opportunity Radar
 * admin routes, same reuse-and-.pick()/.partial() style as
 * problemSchema.js's MetaSchema.
 */

// Only these two get real URL validation (they're the two fields PART 17
// explicitly calls out for "validate all URLs, prevent unsafe redirects").
// http(s)-only — no javascript:, data:, etc.
const OfficialUrlSchema = z
  .string()
  .url("Must be a valid URL")
  .refine((url) => /^https?:\/\//i.test(url), {
    message: "URL must start with http:// or https://",
  });

export const OpportunityCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  organization: z.string().min(1, "Organization is required").max(120),
  organizationLogoUrl: z.string().url().nullable().optional().default(null),
  type: z.enum([
    "internship",
    "hackathon",
    "research_internship",
    "open_source_program",
    "fellowship",
    "coding_competition",
    "student_program",
    "scholarship",
    "developer_program",
    "entry_level_job",
    "other",
  ]),
  category: z.string().min(1, "Category is required").max(80),
  shortSummary: z.string().min(1, "Short summary is required").max(220),
  description: z.string().min(1, "Description is required"),

  eligibility: z.string().max(2000).default(""),
  eligibleDegrees: z.array(z.string()).default([]),
  eligibleBranches: z.array(z.string()).default([]),
  eligibleGraduationYears: z.array(z.number().int()).default([]),
  minYear: z.number().int().min(1).max(6).nullable().optional().default(null),
  maxYear: z.number().int().min(1).max(6).nullable().optional().default(null),

  location: z.string().max(200).default(""),
  workMode: z.enum(["remote", "hybrid", "onsite"]).default("remote"),
  country: z.string().max(80).default(""),
  stipend: z.string().max(120).default(""),
  prize: z.string().max(120).default(""),
  compensationNotes: z.string().max(500).default(""),

  duration: z.string().max(80).default(""),
  applicationDeadline: z.coerce.date().nullable().optional().default(null),
  startDate: z.coerce.date().nullable().optional().default(null),

  officialApplicationUrl: OfficialUrlSchema,
  officialSourceUrl: OfficialUrlSchema,

  verificationStatus: z.enum(["unverified", "verified"]).default("unverified"),
  verificationNotes: z.string().max(2000).default(""),

  sourceType: z.enum(["manual", "ai_research"]).default("manual"),
});

// Every field optional for PATCH — admin edits a subset at a time.
export const OpportunityUpdateSchema = OpportunityCreateSchema.partial();

export const OpportunityRejectSchema = z.object({
  reason: z.string().min(1, "A rejection reason is required").max(500),
});

export const ApplyClickTrackSchema = z.object({
  source: z.enum(["whatsapp", "discord", "linkedin", "direct", "other"]).default("direct"),
});
