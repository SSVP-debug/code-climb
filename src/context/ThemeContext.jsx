import { createContext, useContext, useMemo, useState } from "react";
import { getTheme, DEFAULT_THEME } from "../themes";
import {
    getCurrentTheme,
    saveThemeSelection,
    loadThemeSelection,
} from "../utils/themeStorage";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [themeId, setThemeIdState] = useState(
        () => getCurrentTheme()
    );
    const [themeInfo, setThemeInfo] = useState(
        () => loadThemeSelection()
    );

    const setTheme = (nextThemeId) => {
        saveThemeSelection(nextThemeId);

        setThemeIdState(nextThemeId);
        setThemeInfo(loadThemeSelection());
    };

    const value = useMemo(
        () => ({
            themeId,
            themeInfo,
            theme: getTheme(themeId),
            setTheme,
        }),
        [themeId, themeInfo]
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error("useTheme must be used inside ThemeProvider");
    }

    return context;
}
