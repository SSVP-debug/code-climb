/**
 * Shared Gemini API helper — used ONLY by Opportunity Import
 * (backend/utils/opportunityAI.js), not by any other AI feature. Hints,
 * insights, and the mock interviewer continue calling Anthropic directly
 * via anthropicClient.js, untouched.
 *
 * Uses Google's official current JS/TS SDK, `@google/genai` (see
 * package.json). Mirrors callClaudeJSON()'s exact error-shape contract on
 * purpose — status/code/providerType/providerBody — so
 * adminOpportunityImportController.js's existing diagnostic logging and
 * status-based response branching work identically regardless of which
 * provider actually ran, with zero controller-side special-casing.
 */
import { GoogleGenAI } from "@google/genai";

// Sourced from @google/genai's own current README (every example in the
// installed SDK version uses this model) rather than guessed/memorized —
// Gemini 2.5 Flash is Google's fast, low-cost model tier, well suited to
// a bounded structured-extraction task like this one and within typical
// free-tier rate limits for occasional admin-triggered calls (this isn't
// a high-volume endpoint — see MAX_INPUT_CHARS/MAX_OPPORTUNITIES_PER_IMPORT
// in the controller). Configurable via GEMINI_MODEL specifically so this
// can be bumped later without a code change if Google's free-tier model
// lineup shifts.
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

/**
 * Calls Gemini with a system + user prompt and parses the response as
 * JSON. Throws on any failure (missing key, network error, non-2xx, bad
 * JSON) — callers are expected to catch and log with their own context,
 * exactly like callClaudeJSON().
 *
 * Error shape on the thrown Error, mirroring anthropicClient.js:
 *   - `.status`   — present (a number) only when Gemini actually
 *                    responded with a non-2xx HTTP status. Absent for a
 *                    network-level failure (DNS/connection/TLS) — never
 *                    got a response from Gemini at all.
 *   - `.code`     — present for network-level failures only (e.g.
 *                    "ECONNREFUSED", "ENOTFOUND"), pulled from the
 *                    underlying fetch error, same as Anthropic's client.
 *   - `.providerType` — Google's own error classification string (e.g.
 *                    "UNAUTHENTICATED", "PERMISSION_DENIED",
 *                    "RESOURCE_EXHAUSTED", "INVALID_ARGUMENT"), parsed
 *                    from the SDK's ApiError. Analogous to Anthropic's
 *                    `authentication_error`/`rate_limit_error`/etc, just
 *                    Google's own enum values instead.
 *   - `.providerBody` — the raw provider error body, kept for
 *                    server-side logging only. NEVER read by the
 *                    controller when building the frontend-facing
 *                    response, and NEVER included in the safe diagnostic
 *                    object logged to Render (see
 *                    adminOpportunityImportController.js's
 *                    buildSafeExtractionDiagnostic()).
 */
export async function callGeminiJSON({ systemPrompt, userMessage, maxTokens = 4000 }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const ai = new GoogleGenAI({ apiKey });

  let response;
  try {
    response = await ai.models.generateContent({
      model,
      contents: userMessage,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: maxTokens,
        // Structured JSON output (STEP 5) — has the model return JSON
        // directly rather than free-form text we'd have to fence-strip
        // and hope parses. The existing application-level schema/
        // validation in the controller remains the actual source of
        // truth regardless — this only reduces how often Gemini's raw
        // output fails to parse at all, it isn't trusted on its own.
        responseMimeType: "application/json",
      },
    });
  } catch (err) {
    // The SDK's own ApiError class (see @google/genai's exported
    // ApiError) is thrown specifically when Gemini's API returned a
    // non-2xx response — it carries `.status` (the real HTTP status) and
    // a `.message` that is JSON.stringify() of Google's standard error
    // body: { error: { code, message, status: "<ENUM_STRING>" } }.
    // Detecting it by name/status (rather than `instanceof ApiError`,
    // which would require importing the class just for this check) keeps
    // this resilient to whichever exact export shape a future SDK
    // version uses.
    if (err?.name === "ApiError" && typeof err.status === "number") {
      const wrapped = new Error(`Gemini API error (${err.status}): ${err.message}`);
      wrapped.status = err.status;
      wrapped.providerBody = err.message;

      try {
        const parsedBody = JSON.parse(err.message);
        wrapped.providerType = parsedBody?.error?.status || null;
      } catch {
        wrapped.providerType = null;
      }

      throw wrapped;
    }

    // Anything else — the SDK's internal fetch failed before ever
    // getting a response (DNS failure, connection refused, egress
    // blocked, TLS error). No `.status` exists here at all, matching
    // anthropicClient.js's exact same distinction.
    const wrapped = new Error(`Failed to reach Gemini API: ${err.message}`, { cause: err });
    wrapped.code = err.code || err.cause?.code || null;
    throw wrapped;
  }

  const rawText = response.text ?? "";
  if (!rawText) {
    throw new Error("Gemini returned an empty response.");
  }

  // Defensive: even with responseMimeType: "application/json" requested,
  // strip markdown fences before parsing, same safety net
  // callClaudeJSON() applies — a model occasionally wrapping structured
  // output in ```json fences despite the response-format request isn't
  // unheard of.
  const clean = rawText.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch (parseErr) {
    throw new Error(`Gemini returned a non-JSON response: ${parseErr.message}`);
  }
}
