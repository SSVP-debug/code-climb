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

  const response = await fetch(ANTHROPIC_API_URL, {
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

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  const rawText = data.content?.[0]?.text ?? "";

  // Strip markdown fences if Claude adds them despite instructions.
  const clean = rawText.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}