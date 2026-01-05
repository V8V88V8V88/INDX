"use client";

const SETTINGS_KEY = "indx_settings";



export type DistanceUnit = "km" | "miles";
export type NumberFormat = "indian" | "international";
export type Currency = "INR" | "USD";

export interface Settings {
  accentColor: string;
  distanceUnit: DistanceUnit;
  numberFormat: NumberFormat;
  currency: Currency;
}

const defaultSettings: Settings = {
  accentColor: "teal",
  distanceUnit: "km",
  numberFormat: "indian",
  currency: "INR",
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


