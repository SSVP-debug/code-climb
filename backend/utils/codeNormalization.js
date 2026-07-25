import crypto from "crypto";

/**
 * Normalizes source code so cosmetic-only edits (whitespace, indentation,
 * comments, blank lines) don't register as a "new attempt" for the wrong-
 * answer encouragement engine — only a logical code change should. This is
 * deliberately conservative and NOT a parser/AST diff: it only needs to
 * catch the common case of "ran the exact same solution again" vs. "changed
 * something." False negatives (treating a trivial logic tweak as "new")
 * are fine and expected — the cost of getting this wrong is just a repeat
 * encouragement message, not a grading decision.
 */
export function normalizeCode(code, language) {
  let src = String(code ?? "");

  if (language === "python") {
    // Python comments only ever start with # (no block-comment syntax).
    src = src.replace(/#.*$/gm, "");
  } else {
    // javascript, java, cpp all share C-style comment syntax.
    src = src.replace(/\/\*[\s\S]*?\*\//g, "");
    src = src.replace(/\/\/.*$/gm, "");
  }

  return src
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

/** SHA-256 hex digest of the normalized code — cheap to store/compare. */
export function hashNormalizedCode(code, language) {
  const normalized = normalizeCode(code, language);
  return crypto.createHash("sha256").update(normalized).digest("hex");
}
