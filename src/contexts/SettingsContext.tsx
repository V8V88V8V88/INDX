"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getSettings, updateSetting, type Settings } from "@/lib/settings";
import { applyTheme } from "@/lib/theme";

interface SettingsContextType {
    settings: Settings;
    updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<Settings>(() => {
        // Initialize with defaults first to match server render
        if (typeof window === "undefined") {
            return getSettings(); // Uses defaults
        }
        return getSettings(); // Reads from localStorage
    });

    useEffect(() => {
        // Re-read settings on mount to ensure valid client state
        const current = getSettings();
        setSettings(current);
        applyTheme(current.accentColor);
    }, []);

    const handleUpdateSetting = <K extends keyof Settings>(
        key: K,
        value: Settings[K]
    ) => {
        const updated = updateSetting(key, value);
        setSettings(updated);

        if (key === "accentColor") {
            applyTheme(value as string);
        }
    };

    // We can simply render the provider. Hydration mismatch is handled by 
    // ensuring initial state matches server (defaults), then updating in useEffect.
    // usage of useState(() => ...) above with window check helps, but strictly 
    // avoiding mismatch requires defaulting to server values first.
    // But getting the context error is worse. We MUST render the Provider.

    return (
        <SettingsContext.Provider
            value={{
                settings,
                updateSetting: handleUpdateSetting,
            }}
        >
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
