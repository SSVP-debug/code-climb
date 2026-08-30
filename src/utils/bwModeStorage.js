const STORAGE_KEY = "codeclub.bwMode";

/**
 * Black & White Mode is the platform's dark/light theme preference
 * (see index.css's semantic tokens + BWModeContext), not tied to any
 * particular gamified story-universe skin or role — so it gets its own
 * tiny storage key rather than piggybacking on themeStorage.js, which is
 * that separate, unrelated skin system.
 */
export function loadBWModePreference() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "true";
}

export function saveBWModePreference(enabled) {
    localStorage.setItem(STORAGE_KEY, String(enabled));
}