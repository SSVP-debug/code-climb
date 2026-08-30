import { useEffect, useMemo, useState } from "react";
import { loadBWModePreference, saveBWModePreference } from "../utils/bwModeStorage";
import { BWModeContext } from "./BWModeContextObject";

// Class name toggled on <html>. Kept in one place so the CSS in index.css
// and this provider never drift out of sync.
export const BW_MODE_CLASS = "bw-mode";

export function BWModeProvider({ children }) {
    const [bwMode, setBwMode] = useState(() => loadBWModePreference());

    // Reflect state onto the document root rather than a component-level
    // wrapper — Black & White Mode is a platform-wide theme (nav, pages,
    // modals, everything), and <html> is the one element every one of
    // those renders underneath, regardless of route or role. index.html
    // has a small inline script that sets this same class before first
    // paint from the same storage key, so a returning visitor doesn't
    // see a flash of the wrong theme before this effect runs.
    useEffect(() => {
        document.documentElement.classList.toggle(BW_MODE_CLASS, bwMode);
    }, [bwMode]);

    const toggleBWMode = () => {
        setBwMode((prev) => {
            const next = !prev;
            saveBWModePreference(next);
            return next;
        });
    };

    const value = useMemo(
        () => ({ bwMode, toggleBWMode }),
        [bwMode]
    );

    return (
        <BWModeContext.Provider value={value}>
            {children}
        </BWModeContext.Provider>
    );
}