/**
 * adminOpportunityImportController.js — "Import Opportunities" workflow.
 *
 * Two-step, human-in-the-loop pipeline, matching the mandated
 * Research → Import → Extract → Draft → Human Review → Verification →
 * Approve → Publish sequence:
 *
 *   1. extractOpportunities(): admin pastes raw research text (e.g. a
 *      Claude research answer). callOpportunityAI() (see
 *      utils/opportunityAI.js) routes this to whichever provider is
 *      configured — Gemini by default, or Anthropic via
 *      OPPORTUNITY_AI_PROVIDER=anthropic — which parses it into a
 *      structured array of *candidate* opportunities. Nothing is written
 *      to the database here — this is a pure extraction step, returned
 *      to the admin for review/selection in the UI.
 *
 *   2. importSelectedOpportunities(): admin has reviewed the candidates
 *      client-side, corrected/deselected as needed, and POSTs the final
 *      list. Each one is created exactly the way createOpportunity() in
 *      adminOpportunityController.js creates a manual draft — same CC-ID
 *      allocation, same forced status, same audit log — except:
 *        - status is always "pending_review" (skipping "draft" — these
 *          already went through one review pass in the extraction UI,
 *          but PART 16/DOC's "human review" gate still fully applies:
 *          nothing here is publish-eligible without an admin approve +
 *          publish action).
 *        - verificationStatus is always forced to "unverified" and
 *          sourceType to "ai_research", regardless of what the pasted
 *          research claimed or what Claude's extraction inferred —
 *          only an admin's own verify action (via the normal edit form)
 *          can ever set verificationStatus: "verified".
 */
import Opportunity from "../models/Opportunity.js";
import { nextSequence } from "../models/Counter.js";
import { recordAdminAction } from "../services/adminAuditLog.js";
import { callOpportunityAI, checkOpportunityAIConfig } from "../utils/opportunityAI.js";
import { logger } from "../config/logger.js";
import { OpportunityCreateSchema } from "../schemas/opportunitySchema.js";

const MAX_INPUT_CHARS = 20000; // guards against pathological Claude cost / prompt-injection payloads
const MAX_OPPORTUNITIES_PER_IMPORT = 25;

/**
 * buildSafeExtractionDiagnostic() — server-log-only diagnostic for a
 * failed callOpportunityAI() call (regardless of which provider is
 * configured — Gemini or Anthropic), deliberately narrow: only the
 * fields needed to tell "missing config" from "provider rejected the
 * key" from "provider rejected the model" from "rate limited/overloaded"
 * from "no response reached us at all" apart, at a glance, from the log
 * line itself — nothing that could ever be a secret.
 *
 * Explicitly NEVER includes: err.stack (can embed request context in
 * some error shapes), err.providerBody (the provider's raw response
 * text — not a secret per se, but unbounded and not needed once
 * providerType is extracted), the research text, or anything from
 * process.env.
 *
 * `err.status` present (a number) means a response DID come back from
 * the provider, just a non-2xx one — that's the "hasProviderResponse:
 * true" case. `err.status` absent means the provider client's own fetch
 * never got a response at all (DNS/connection/TLS failure) — both
 * geminiClient.js and anthropicClient.js deliberately do not set
 * `.status` in that case, so this distinction falls out for free here
 * regardless of which one actually ran.
 */
function buildSafeExtractionDiagnostic(err) {
  const hasProviderResponse = typeof err.status === "number";
  return {
    name: err.name || null,
    message: err.message || null,
    status: err.status ?? null,
    code: err.code ?? null,
    hasProviderResponse,
    providerStatus: hasProviderResponse ? err.status : null,
    providerType: err.providerType ?? null,
    kind: hasProviderResponse ? "provider_response" : "network_or_config",
  };
}

function slugify(title) {
  return (
    (title || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) || "opportunity"
  );
}

async function allocateIdentity(title) {
  const ccNumber = await nextSequence("opportunity");
  const ccId = `CC/${String(ccNumber).padStart(3, "0")}`;

  const base = slugify(title);
  let slug = `${base}-${String(ccNumber).padStart(3, "0")}`;
  let attempts = 0;
  while ((await Opportunity.exists({ slug })) && attempts < 5) {
    attempts++;
    slug = `${base}-${String(ccNumber).padStart(3, "0")}-${attempts}`;
  }

  return { ccId, ccNumber, slug };
}

const EXTRACTION_SYSTEM_PROMPT = `You extract structured opportunity listings (internships, hackathons, fellowships, scholarships, and similar student programs) from raw research text pasted by an admin.

Return ONLY a JSON object with this exact shape, nothing else — no markdown, no preamble:
{
  "opportunities": [
    {
      "title": string,
      "organization": string,
      "organizationLogoUrl": string | null,
      "type": one of ["internship","hackathon","research_internship","open_source_program","fellowship","coding_competition","student_program","scholarship","developer_program","entry_level_job","other"],
      "category": string,
      "shortSummary": string (max 220 chars),
      "description": string,
      "eligibility": string,
      "eligibleDegrees": string[],
      "eligibleBranches": string[],
      "eligibleGraduationYears": number[],
      "minYear": number | null,
      "maxYear": number | null,
      "location": string,
      "workMode": one of ["remote","hybrid","onsite"] | null,
      "country": string,
      "duration": string,
      "stipend": string,
      "prize": string,
      "compensationNotes": string,
      "applicationDeadline": string (ISO date, "YYYY-MM-DD") | null,
      "startDate": string (ISO date) | null,
      "officialApplicationUrl": string | null,
      "officialSourceUrl": string | null,
      "flags": string[]
    }
  ]
}

Rules — follow these exactly:
1. Identify EVERY distinct opportunity mentioned in the text, however many there are. Do not merge two different opportunities into one, and do not split one opportunity into two.
2. NEVER invent information. If a field isn't stated or clearly implied in the text, use null for that field (or an empty array for list fields, or an empty string for text fields where null isn't listed above) — do not guess a plausible-sounding value.
3. If a value is present but ambiguous, uncertain, or conflicting within the text (e.g. two different deadlines mentioned for the same opportunity), still make your best extraction of the value AND add a short human-readable note about the ambiguity to that opportunity's "flags" array (e.g. "Deadline mentioned as both Aug 31 and Sep 5 — verify with the admin.").
4. If a field is missing entirely, also add a short note to "flags" naming which required-for-publishing field is missing, so the admin knows to fill it in (e.g. "No official application URL found — required before this can be approved.").
5. Do NOT infer or set any kind of "verified" status — that is not part of this schema and is never something you determine.
6. Only extract opportunities relevant to students (internships, hackathons, fellowships, scholarships, competitions, open-source programs, developer programs, entry-level roles). Ignore unrelated text.
7. If the input text contains no identifiable opportunities, return {"opportunities": []}.`;

// ── POST /api/admin/opportunities/import/extract ─────────────────────────
export async function extractOpportunities(req, res) {
  try {
    const rawText = (req.body?.researchText || "").trim();

    if (!rawText) {
      return res.status(400).json({ error: "Paste some research text to extract from." });
    }
    if (rawText.length > MAX_INPUT_CHARS) {
      return res.status(400).json({
        error: `Research text is too long (max ${MAX_INPUT_CHARS.toLocaleString()} characters). Paste a shorter excerpt.`,
      });
    }

    // Root cause of a 502 this used to return for a missing key:
    // callClaudeJSON()/callGeminiJSON() throw a plain Error("<ENV_VAR> is
    // not set") when their key is missing from the environment — the
    // exact same Error shape as a genuine network/upstream failure — and
    // this used to be mapped to a blanket 502 "couldn't reach the
    // service" response regardless. A missing env var is a server
    // *configuration* problem, not an upstream outage (502 implies "the
    // thing on the other end failed", when nothing was ever contacted).
    //
    // checkOpportunityAIConfig() (utils/opportunityAI.js) answers "is
    // the currently-configured provider (Gemini by default, or Anthropic
    // via OPPORTUNITY_AI_PROVIDER=anthropic) actually usable right now?"
    // without needing this controller to know which env var name to
    // check — that mapping lives in one place, the provider abstraction,
    // not duplicated here. Checking up front (rather than only in the
    // catch block) mirrors the exact convention routes/interview.js uses
    // for this identical situation with Anthropic (see getClaude() +
    // its 503 "AI interviewer unavailable. Set ANTHROPIC_API_KEY to
    // enable." response).
    const configCheck = checkOpportunityAIConfig();
    if (!configCheck.configured) {
      logger.warn(`[OpportunityImport] ${configCheck.reason}`);
      return res.status(503).json({ error: configCheck.reason });
    }

    let parsed;
    try {
      parsed = await callOpportunityAI({
        systemPrompt: EXTRACTION_SYSTEM_PROMPT,
        userMessage: rawText,
        maxTokens: 4000,
      });
    } catch (err) {
      const diagnostic = buildSafeExtractionDiagnostic(err);
      // Log the diagnostic BOTH as a structured merging object (for any
      // log aggregator that parses JSON fields) AND inlined as visible
      // text in the message itself — deliberately redundant. Render's
      // (and many other PaaS) log viewers commonly show only the
      // top-level message string in their default/compact view and
      // don't auto-expand nested JSON objects.
      logger.error(
        diagnostic,
        `[OpportunityImport] AI extraction call failed (provider: ${configCheck.provider}) :: ${JSON.stringify(diagnostic)}`
      );

      // Defensive fallback for the same "not configured" condition in
      // case of a race (env var unset between the check above and this
      // call) — re-checking rather than hardcoding a provider-specific
      // message, since the provider (and therefore which env var) is
      // configurable.
      if (err.message?.includes(" is not set")) {
        const recheck = checkOpportunityAIConfig();
        return res.status(503).json({
          error: recheck.reason || "Opportunity extraction is unavailable. Check the configured AI provider's API key.",
        });
      }

      // Both geminiClient.js and anthropicClient.js attach the real
      // upstream HTTP status to the thrown error — surface a specific,
      // still-secret-free reason instead of one blanket 502 for every
      // case. This is what actually lets "extraction is unavailable
      // because the key is wrong" be told apart from "the provider is
      // rate-limiting us right now" from the response alone, without
      // needing to go dig through server logs every time.
      if (err.status === 401 || err.status === 403) {
        // Never echo the provider's response body here — it can include
        // enough of the request context to be worth keeping server-side
        // only. The status code alone is enough to point at "the
        // configured key is invalid or was revoked."
        return res.status(503).json({
          error: `Opportunity extraction is unavailable — the configured AI API key was rejected. Check ${configCheck.envVar}.`,
        });
      }
      if (err.status === 404) {
        return res.status(503).json({
          error: "Opportunity extraction is unavailable — the configured AI model is not available on this API key/account.",
        });
      }
      if (err.status === 429) {
        return res.status(502).json({
          error: "The extraction service is rate-limited right now. Try again in a minute.",
        });
      }
      if (err.status === 529) {
        return res.status(502).json({
          error: "The extraction service is temporarily overloaded. Try again shortly.",
        });
      }

      return res.status(502).json({
        error: "Couldn't reach the extraction service. Try again in a moment.",
      });
    }

    const candidates = Array.isArray(parsed?.opportunities) ? parsed.opportunities : [];

    if (candidates.length === 0) {
      return res.json({ opportunities: [] });
    }

    // Defensive normalization — Claude is instructed to follow the schema
    // exactly, but this endpoint writes nothing to the DB yet, so it's
    // safe (and cheap) to also coerce/clamp obviously-malformed values
    // here rather than trust the model completely. Nothing here invents
    // missing data — it only clamps/normalizes what Claude already
    // returned, and flags anything it had to touch.
    const normalized = candidates.slice(0, MAX_OPPORTUNITIES_PER_IMPORT).map((c, i) => {
      const flags = Array.isArray(c.flags) ? [...c.flags] : [];

      const VALID_TYPES = [
        "internship", "hackathon", "research_internship", "open_source_program",
        "fellowship", "coding_competition", "student_program", "scholarship",
        "developer_program", "entry_level_job", "other",
      ];
      let type = VALID_TYPES.includes(c.type) ? c.type : "other";
      if (type === "other" && c.type && c.type !== "other") {
        flags.push(`Unrecognized type "${c.type}" — defaulted to "Other", please correct.`);
      }

      const VALID_WORK_MODES = ["remote", "hybrid", "onsite"];
      const workMode = VALID_WORK_MODES.includes(c.workMode) ? c.workMode : "remote";
      if (!VALID_WORK_MODES.includes(c.workMode) && c.workMode) {
        flags.push(`Unrecognized work mode "${c.workMode}" — defaulted to "Remote", please correct.`);
      }

      if (!c.officialApplicationUrl) flags.push("Missing official application URL — required before publishing.");
      if (!c.officialSourceUrl) flags.push("Missing official source/verification URL — required before publishing.");
      if (!c.title) flags.push("Missing title.");
      if (!c.organization) flags.push("Missing organization.");

      return {
        _importIndex: i,
        title: c.title || "",
        organization: c.organization || "",
        organizationLogoUrl: c.organizationLogoUrl || "",
        type,
        category: c.category || "",
        shortSummary: (c.shortSummary || "").slice(0, 220),
        description: c.description || "",
        eligibility: c.eligibility || "",
        eligibleDegrees: Array.isArray(c.eligibleDegrees) ? c.eligibleDegrees : [],
        eligibleBranches: Array.isArray(c.eligibleBranches) ? c.eligibleBranches : [],
        eligibleGraduationYears: Array.isArray(c.eligibleGraduationYears)
          ? c.eligibleGraduationYears.filter((y) => Number.isFinite(y))
          : [],
        minYear: Number.isFinite(c.minYear) ? c.minYear : null,
        maxYear: Number.isFinite(c.maxYear) ? c.maxYear : null,
        location: c.location || "",
        workMode,
        country: c.country || "",
        duration: c.duration || "",
        stipend: c.stipend || "",
        prize: c.prize || "",
        compensationNotes: c.compensationNotes || "",
        applicationDeadline: c.applicationDeadline || null,
        startDate: c.startDate || null,
        officialApplicationUrl: c.officialApplicationUrl || "",
        officialSourceUrl: c.officialSourceUrl || "",
        // Always false here — extraction NEVER determines verification
        // status; this field exists purely so the review UI can show a
        // consistent "Unverified" badge on every candidate, same as a
        // freshly created manual draft.
        verificationStatus: "unverified",
        flags,
      };
    });

    return res.json({ opportunities: normalized });
  } catch (err) {
    logger.error({ err }, "[OpportunityImport] extract failed");
    return res.status(500).json({ error: "Failed to extract opportunities." });
  }
}

// ── POST /api/admin/opportunities/import/bulk ─────────────────────────────
// Body: { opportunities: [ <admin-reviewed candidate objects> ] }
// Each one is independently validated against OpportunityCreateSchema —
// the same schema the manual form's create endpoint uses — so an import
// can't slip in something the manual path would reject. Partial success
// is allowed: a malformed candidate is skipped and reported, it doesn't
// abort the whole batch (the admin already reviewed these one at a time
// in the UI; losing the other 6 valid ones because 1 had a bad URL would
// be a worse experience than the manual form ever has).
export async function importSelectedOpportunities(req, res) {
  try {
    if (!req.userDoc) return res.status(503).json({ error: "Database unavailable." });

    const candidates = Array.isArray(req.body?.opportunities) ? req.body.opportunities : [];
    if (candidates.length === 0) {
      return res.status(400).json({ error: "No opportunities selected to import." });
    }
    if (candidates.length > MAX_OPPORTUNITIES_PER_IMPORT) {
      return res.status(400).json({ error: `Cannot import more than ${MAX_OPPORTUNITIES_PER_IMPORT} at once.` });
    }

    const imported = [];
    const failed = [];

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const parseResult = OpportunityCreateSchema.safeParse(candidate);

      if (!parseResult.success) {
        failed.push({
          index: i,
          title: candidate?.title || "(untitled)",
          errors: parseResult.error.issues.map((iss) => `${iss.path.join(".")}: ${iss.message}`),
        });
        continue;
      }

      const { ccId, ccNumber, slug } = await allocateIdentity(parseResult.data.title);

      const opp = await Opportunity.create({
        ...parseResult.data,
        ccId,
        ccNumber,
        slug,
        status: "pending_review",
        sourceType: "ai_research",
        // Force-override regardless of anything the client sent — see
        // this file's header comment. This is the one line standing
        // between "admin reviewed an import" and "AI research silently
        // became a verified public claim."
        verificationStatus: "unverified",
        createdBy: req.userDoc._id,
        updatedBy: req.userDoc._id,
      });

      imported.push({ _id: opp._id, ccId: opp.ccId, title: opp.title });
    }

    if (imported.length > 0) {
      recordAdminAction({
        adminDoc: req.userDoc,
        action: "opportunity.import_bulk",
        targetType: "Opportunity",
        targetId: "bulk",
        details: {
          importedCount: imported.length,
          failedCount: failed.length,
          ccIds: imported.map((o) => o.ccId),
        },
      });
    }

    return res.status(imported.length > 0 ? 201 : 400).json({ imported, failed });
  } catch (err) {
    logger.error({ err }, "[OpportunityImport] bulk import failed");
    return res.status(500).json({ error: "Failed to import opportunities." });
  }
}
