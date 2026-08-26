/**
 * Content & Execution Architecture, Phase 2.
 *
 * Backs GET /api/languages — the single place the frontend (or any future
 * client) asks "what languages are currently enabled?" instead of
 * hardcoding a list. See config/languages.js for the actual registry;
 * this controller is deliberately thin, the same way problemController.js
 * stays thin over Problem.
 */
import { getEnabledLanguagesForApi } from "../config/languages.js";

// No database read, no cache needed — config/languages.js is an in-memory
// module already, so formatting it into a response is cheaper than a
// cache lookup would be. Toggling a language's `enabled` flag takes
// effect on the next deploy, same as any other config change (see the
// audit's §F for why this is intentionally NOT a database-backed toggle).
export function getLanguages(req, res) {
  res.json({ languages: getEnabledLanguagesForApi() });
}
