
"use client";

import { useEffect } from "react";
import { getSettings } from "@/lib/settings";
import { applyTheme } from "@/lib/theme";

export function ThemeInitializer() {
    useEffect(() => {
        const settings = getSettings();
        if (settings.accentColor) {
            applyTheme(settings.accentColor);
        }
    }, []);

    return null;
}
