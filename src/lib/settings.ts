"use client";

const SETTINGS_KEY = "indx_settings";

export interface Settings {
  disableLocalData: boolean;
}

const defaultSettings: Settings = {
  disableLocalData: false,
};

export function getSettings(): Settings {
  if (typeof window === "undefined") return defaultSettings;
  
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<Settings>;
      return { ...defaultSettings, ...parsed };
    }
  } catch {
    // Invalid JSON, use defaults
  }
  
  return defaultSettings;
}

export function saveSettings(settings: Settings): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage failed, ignore
  }
}

export function updateSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K]
): Settings {
  const settings = getSettings();
  const updated = { ...settings, [key]: value };
  saveSettings(updated);
  return updated;
}


