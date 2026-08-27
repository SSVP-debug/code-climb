const STORAGE_KEY = "codeclub.bwMode";

/**
 * Black & White Mode is a platform-wide accessibility/aesthetic
 * preference (grayscale filter over the whole app), not tied to any
 * particular theme or role — so it gets its own tiny storage key rather
 * than piggybacking on themeStorage.js.
 */
export function loadBWModePreference() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "true";
}

export function saveBWModePreference(enabled) {
    localStorage.setItem(STORAGE_KEY, String(enabled));
}
