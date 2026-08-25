/**
 * opportunityAI.js — provider abstraction for Opportunity Import
 * extraction ONLY. Nothing else in Code Club routes through this file —
 * hints, insights, and the mock interviewer keep calling
 * anthropicClient.js directly, unchanged.
 *
 * adminOpportunityImportController.js calls callOpportunityAI() and
 * never imports geminiClient.js or anthropicClient.js itself — that's
 * the whole point: swapping providers, or adding a third one later,
 * never touches the controller.
 *
 * Provider selection: OPPORTUNITY_AI_PROVIDER env var, one of "gemini" |
 * "anthropic". Defaults to "gemini" if unset — Anthropic's credits were
 * the reason this migration exists in the first place (see this file's
 * git history / the OpportunityImport diagnostic logs from before this
 * change), so "gemini" is the safer default for this specific feature
 * rather than silently falling back to the provider that was just
 * confirmed broken. To go back to Anthropic later: set
 * OPPORTUNITY_AI_PROVIDER=anthropic — no code change required.
 */
import { callGeminiJSON } from "./geminiClient.js";
import { callClaudeJSON } from "./anthropicClient.js";

const SUPPORTED_PROVIDERS = ["gemini", "anthropic"];
const DEFAULT_PROVIDER = "gemini";

// Single source of truth for which env var each provider needs — the
// controller asks this file "is the configured provider ready?" rather
// than knowing GEMINI_API_KEY/ANTHROPIC_API_KEY names itself, so adding
// a third provider later never requires touching the controller.
const PROVIDER_API_KEY_ENV_VARS = {
  gemini: "GEMINI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
};

function resolveProvider() {
  const configured = (process.env.OPPORTUNITY_AI_PROVIDER || DEFAULT_PROVIDER).trim().toLowerCase();
  return configured;
}

/**
 * callOpportunityAI({ systemPrompt, userMessage, maxTokens }) — same
 * call shape as callClaudeJSON()/callGeminiJSON() (this is intentionally
 * a thin pass-through, not a place to build prompts or parse/normalize
 * opportunity data — that logic stays in
 * adminOpportunityImportController.js exactly where it already lives, so
 * there's exactly one prompt and one normalization path regardless of
 * provider).
 *
 * Throws a plain, safe configuration Error (no provider call attempted)
 * if OPPORTUNITY_AI_PROVIDER is set to anything other than "gemini" or
 * "anthropic" — this is a deploy-time misconfiguration, not a runtime
 * provider failure, so it's deliberately NOT shaped like a provider
 * error (no `.status`/`.providerType`): the controller's existing
 * "ANTHROPIC_API_KEY is not set"-style 503 branch already handles a
 * message containing "is not set"; an unsupported-provider message is
 * similarly plain-text so it renders through that same generic path
 * without needing special-casing there.
 */
export async function callOpportunityAI({ systemPrompt, userMessage, maxTokens }) {
  const provider = resolveProvider();

  if (provider === "gemini") {
    return callGeminiJSON({ systemPrompt, userMessage, maxTokens });
  }

  if (provider === "anthropic") {
    return callClaudeJSON({ systemPrompt, userMessage, maxTokens });
  }

  throw new Error(
    `Unsupported OPPORTUNITY_AI_PROVIDER "${provider}" — expected one of: ${SUPPORTED_PROVIDERS.join(", ")}.`
  );
}

// Exported for tests / anything that needs to display or log which
// provider is currently active without duplicating the resolution logic.
export function getOpportunityAIProvider() {
  return resolveProvider();
}

/**
 * checkOpportunityAIConfig() — answers "is the currently-configured
 * provider actually usable right now?" without making a network call.
 * Used by the controller as an upfront gate (returns a clear 503 before
 * even attempting extraction) and again defensively inside the catch
 * block for the race where the env var vanishes between the upfront
 * check and the actual provider call.
 *
 * Returns:
 *   { configured: true,  provider, envVar }               — ready to call
 *   { configured: false, provider, envVar, reason }        — missing key
 *   { configured: false, provider: <raw>, envVar: null, reason } — unsupported provider value
 */
export function checkOpportunityAIConfig() {
  const provider = resolveProvider();

  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    return {
      configured: false,
      provider,
      envVar: null,
      reason: `Opportunity extraction is misconfigured — unsupported OPPORTUNITY_AI_PROVIDER "${provider}". Expected one of: ${SUPPORTED_PROVIDERS.join(", ")}.`,
    };
  }

  const envVar = PROVIDER_API_KEY_ENV_VARS[provider];
  if (!process.env[envVar]) {
    return {
      configured: false,
      provider,
      envVar,
      reason: `Opportunity extraction is unavailable. Set ${envVar} to enable.`,
    };
  }

  return { configured: true, provider, envVar, reason: null };
}
