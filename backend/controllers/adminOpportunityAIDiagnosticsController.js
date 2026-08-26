/**
 * adminOpportunityAIDiagnosticsController.js
 *
 * ⚠️ TEMPORARY DIAGNOSTIC ENDPOINT ⚠️
 * TODO: Delete this file and its route in routes/admin.js once the
 * correct GEMINI_MODEL value has been confirmed against the production
 * GEMINI_API_KEY and Opportunity Import extraction is verified working
 * end-to-end. Added solely to answer "what models can this exact Render
 * key actually see?" after gemini-2.5-flash and gemini-2.5-flash-lite
 * both produced a "model not available" (404-class) error from the real
 * extraction call — see adminOpportunityImportController.js's 404
 * branch. This file is NOT part of the intended long-term Opportunity
 * Radar surface and does not touch the extraction pipeline at all.
 *
 * Deliberately bypasses utils/opportunityAI.js's provider abstraction —
 * this diagnostic is Gemini-specific by design (the question being asked
 * is "what can the Gemini key see", not "what does the currently
 * configured provider do"), so it talks to Google's Models List REST API
 * directly: GET https://generativelanguage.googleapis.com/v1beta/models
 *
 * Safety:
 *   - GEMINI_API_KEY is read only from process.env, sent only in the
 *     outbound request to Google (as Google's REST API requires — via a
 *     `key` query parameter), and NEVER logged or included in any
 *     response field.
 *   - No raw request headers, no Authorization header value, no full
 *     Google response body are ever logged or returned — only the
 *     specific safe fields listed below.
 *   - This endpoint touches no research text and no other secrets
 *     (Firebase, MongoDB, user tokens) at all.
 */
import { logger } from "../config/logger.js";

const MODELS_LIST_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// GET /api/admin/opportunities/ai-diagnostics  (requireAdmin only — see routes/admin.js)
export async function getOpportunityAIDiagnostics(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  const configuredModel = process.env.GEMINI_MODEL || null;

  if (!apiKey) {
    return res.status(200).json({
      configured: false,
      provider: "gemini",
      configuredModel,
      googleStatus: null,
      models: [],
    });
  }

  let response;
  try {
    // Google's REST API accepts the key as a `key` query parameter for
    // simple GET requests like this one — no Authorization header
    // needed, so there's no header value to accidentally log either.
    response = await fetch(`${MODELS_LIST_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "GET",
    });
  } catch (err) {
    // Network-level failure — never got a response from Google at all.
    // Log only the safe, non-sensitive parts of the error (name/message/
    // code), same convention as geminiClient.js's own network-failure
    // handling. The request URL itself (which contains the key) is
    // never passed to the logger.
    logger.error(
      { name: err.name, message: err.message, code: err.code || err.cause?.code || null },
      "[OpportunityAIDiagnostics] Failed to reach Google's models.list endpoint"
    );
    return res.status(502).json({
      configured: true,
      provider: "gemini",
      configuredModel,
      googleStatus: null,
      errorType: "network_error",
      errorMessage: "Could not reach Google's API.",
    });
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON response body (e.g. an upstream proxy's HTML error page)
    // — handled below via the `body === null` fallback, never throws.
  }

  if (!response.ok) {
    // Google's standard error shape: { error: { code, message, status } }
    // — `status` here is a string enum like "UNAUTHENTICATED",
    // "PERMISSION_DENIED", "RESOURCE_EXHAUSTED" (429/quota), etc. Only
    // that classification string and the human-readable message are
    // surfaced — never the full raw body (which is logged, not
    // returned, and even then only at warn level with just the fields
    // below, not the full body object).
    const errorType = body?.error?.status || null;
    const errorMessage = body?.error?.message || null;

    logger.warn(
      { googleStatus: response.status, errorType },
      "[OpportunityAIDiagnostics] Google models.list returned a non-2xx response"
    );

    return res.status(200).json({
      configured: true,
      provider: "gemini",
      configuredModel,
      googleStatus: response.status,
      errorType,
      errorMessage,
    });
  }

  // Success — list only the specific safe fields per model, never the
  // full raw model object (which can include additional metadata beyond
  // what's needed here).
  const models = Array.isArray(body?.models)
    ? body.models.map((m) => ({
        name: m.name,
        supportedGenerationMethods: m.supportedGenerationMethods || [],
        inputTokenLimit: m.inputTokenLimit ?? null,
        outputTokenLimit: m.outputTokenLimit ?? null,
      }))
    : [];

  return res.status(200).json({
    configured: true,
    provider: "gemini",
    configuredModel,
    googleStatus: response.status,
    models,
  });
}
