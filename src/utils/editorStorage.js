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
