const STORAGE_KEY = "codeclub.theme";

export function saveThemeSelection(themeId) {
    const existing = loadThemeSelection();

    const payload = {
        currentTheme: themeId,

        selectedAt:
            existing?.selectedAt ??
            new Date().toISOString(),

        lastChangedAt:
            new Date().toISOString(),
    };

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(payload)
    );
}

export function loadThemeSelection() {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function getCurrentTheme() {
    const data = loadThemeSelection();
    return data?.currentTheme ?? null;
}

