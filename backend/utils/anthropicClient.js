/**
 * Shared Claude API helper.
 *
 * insightsController.js already calls Claude via a raw fetch() to
 * https://api.anthropic.com/v1/messages, rather than the @anthropic-ai/sdk
 * package that sits unused in package.json — that's a deliberate existing
 * choice (see docs/phase8-progress.md, Batch D notes on 097), not something
 * to change here. This helper mirrors that exact pattern so the weekly
 * review email (commit 097) reuses the same client setup instead of
 * introducing a second way of calling Claude.
 *
 * insightsController.js itself is intentionally left untouched — refactoring
 * a live, working route to share this helper is a separate, out-of-scope
 * change with its own regression risk, not part of adding a new script.
 */

const CLAUDE_MODEL = "claude-sonnet-4-6";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

/**
 * Calls Claude with a system + user prompt and parses the response as JSON.
 * Throws on any failure (missing key, network error, non-2xx, bad JSON) —
 * callers are expected to catch and log with their own context, since a
 * generic error message here would lose that context.
 */
export async function callClaudeJSON({ systemPrompt, userMessage, maxTokens = 400 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  let response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
  } catch (err) {
    // fetch() itself threw — DNS failure, connection refused, egress
    // blocked from the host, TLS error, etc. No HTTP status exists here
    // at all; callers should treat the absence of `.status` on the
    // thrown error as "never got a response," distinct from "got a
    // response Anthropic didn't like" below.
    //
    // Node's undici (fetch implementation) attaches a `.code` (e.g.
    // "ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT") to the underlying cause
    // for most network-level failures — surface it on the thrown error
    // too, not just buried in `.cause`, so callers building a diagnostic
    // don't need to know undici's error-wrapping shape to find it.
    const wrapped = new Error(`Failed to reach Anthropic API: ${err.message}`, { cause: err });
    wrapped.code = err.code || err.cause?.code || null;
    throw wrapped;
  }

  if (!response.ok) {
    const errBody = await response.text();
    // Attach the real HTTP status to the thrown error (not just baked
    // into the message string) so callers can distinguish e.g. 401
    // (bad/revoked key — a config problem) from 404 (invalid model
    // string — also effectively a config problem, but a different fix)
    // from 429/529 (rate-limited/overloaded — a transient provider
    // problem, worth a plain retry) without parsing message text.
    const err = new Error(`Anthropic API error (${response.status}): ${errBody}`);
    err.status = response.status;
    err.providerBody = errBody;

    // Anthropic's error responses are JSON shaped like
    // { "type": "error", "error": { "type": "authentication_error", "message": "..." } }.
    // Extract just the `type` string — e.g. "authentication_error",
    // "not_found_error", "rate_limit_error", "overloaded_error" — which
    // is exactly the field name Anthropic itself uses to classify the
    // failure, and safe to log (it's a fixed enum-like category, never
    // user data or secrets). Best-effort: errBody isn't guaranteed to be
    // valid JSON (e.g. an upstream proxy/CDN error page), so this must
    // not throw if it isn't.
    try {
      const parsedBody = JSON.parse(errBody);
      err.providerType = parsedBody?.error?.type || parsedBody?.type || null;
    } catch {
      err.providerType = null;
    }

    throw err;
  }

  const data = await response.json();
  const rawText = data.content?.[0]?.text ?? "";

  // Strip markdown fences if Claude adds them despite instructions.
  const clean = rawText.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}