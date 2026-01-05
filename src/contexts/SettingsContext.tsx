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
        return getSettings();
    });

    useEffect(() => {
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
