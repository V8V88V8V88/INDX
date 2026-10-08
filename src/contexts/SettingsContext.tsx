"use client";

import React, { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import {
    getServerSettings,
    getSettings,
    subscribeSettings,
    updateSetting,
    type Settings,
} from "@/lib/settings";
import { applyTheme } from "@/lib/theme";

interface SettingsContextType {
    settings: Settings;
    updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    // Server and hydration render use the defaults, then the stored settings
    // are picked up, so the first client render never mismatches the HTML.
    const settings = useSyncExternalStore(subscribeSettings, getSettings, getServerSettings);

    useEffect(() => {
        applyTheme(settings.accentColor);
    }, [settings.accentColor]);

    return (
        <SettingsContext.Provider value={{ settings, updateSetting }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
}
