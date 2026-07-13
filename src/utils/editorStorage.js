export function getCodeStorageKey(
  slug,
  language
) {
  return `code-${slug}-${language}`;
}

export function loadSavedCode(
  slug,
  language,
  fallback = ""
) {
  const saved = localStorage.getItem(
    getCodeStorageKey(slug, language)
  );

  return saved !== null ? saved : fallback;
}

export function saveCode(
  slug,
  language,
  code
) {
  localStorage.setItem(
    getCodeStorageKey(slug, language),
    code
  );
}

export function saveLanguage(slug, language) {
  localStorage.setItem(
    `language-${slug}`,
    language
  );
}

export function loadLanguage(slug) {
  return (
    localStorage.getItem(`language-${slug}`) ||
    "python"
  );
}

// Font size is a reading preference, not tied to any one problem — unlike
// everything else in this file, this key is global (no slug in it).
const FONT_SIZE_KEY = "editor-font-size";
export const EDITOR_FONT_SIZE_DEFAULT = 14;
export const EDITOR_FONT_SIZE_MIN = 12;
export const EDITOR_FONT_SIZE_MAX = 22;

export function loadFontSize() {
  const saved = parseInt(localStorage.getItem(FONT_SIZE_KEY), 10);
  if (Number.isNaN(saved)) return EDITOR_FONT_SIZE_DEFAULT;
  return Math.min(EDITOR_FONT_SIZE_MAX, Math.max(EDITOR_FONT_SIZE_MIN, saved));
}

export function saveFontSize(size) {
  localStorage.setItem(FONT_SIZE_KEY, String(size));
}