/**
 * languageDrivers/index.js
 *
 * Plan 011 (Batch 3): replaces two independent `if (language === "...")`
 * dispatch chains (generateDriverCode.js and operationSequenceDriver.js)
 * with a lookup into this per-language module registry. The chains had no
 * shared contract forcing them to stay in sync — which is exactly how
 * TypeScript's rollout shipped "done" (green tests, clean lint, passed
 * review) while missing operationSequenceDriver.js's branch entirely,
 * undetected until someone happened to run
 * backend/scripts/validateProblemContracts.js by hand. See
 * plans/011-language-and-problem-extensibility.md, Part B.
 *
 * The loop below is the actual enforcement mechanism: it fails at module
 * load — i.e. at server boot, in CI, the first time anything imports this
 * file — if any language registered in backend/config/languages.js is
 * missing a driver module, or that module is missing either required
 * function. Not at some later "did you remember to check the other file
 * too" step that's easy to skip. A new language cannot ship half-wired.
 */
import { LANGUAGES } from "../../config/languages.js";
import * as python from "./python.js";
import * as javascript from "./javascript.js";
import * as typescript from "./typescript.js";
import * as java from "./java.js";
import * as cpp from "./cpp.js";
import * as c from "./c.js";

const DRIVERS = { python, javascript, typescript, java, cpp, c };

for (const key of Object.keys(LANGUAGES)) {
  const driver = DRIVERS[key];
  if (!driver) {
    throw new Error(
      `languageDrivers/index.js: no driver module registered for language "${key}" ` +
        `(add backend/utils/languageDrivers/${key}.js and wire it into DRIVERS here — see backend/config/languages.js)`
    );
  }
  if (typeof driver.generate !== "function") {
    throw new Error(`languageDrivers/index.js: language "${key}" driver is missing generate()`);
  }
  if (typeof driver.generateOperationSequence !== "function") {
    throw new Error(
      `languageDrivers/index.js: language "${key}" driver is missing generateOperationSequence() ` +
        `(this is the exact gap that let TypeScript ship without operation-sequence support — see this file's header comment)`
    );
  }
}

/**
 * getDriver — look up a language's driver module by key. Returns
 * undefined for an unregistered key; callers (generateDriverCode.js,
 * operationSequenceDriver.js) are responsible for throwing their own
 * "Unsupported language" error, matching their pre-existing error message
 * shape/wording so this refactor doesn't change either function's
 * observable behavior for an invalid language.
 */
export function getDriver(languageKey) {
  return DRIVERS[languageKey];
}